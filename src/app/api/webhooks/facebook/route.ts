import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FacebookService } from '@/lib/services/facebook'
import { OpenAIService } from '@/lib/services/openai'
import { NotificationManager } from '@/lib/services/notifications'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Verificar webhook de Facebook
  if (mode === 'subscribe' && token === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN) {
    console.log('Facebook webhook verified')
    return new NextResponse(challenge)
  }

  return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verificar que es un evento de leadgen
    if (body.object !== 'leadgen') {
      return NextResponse.json({ status: 'ignored' })
    }

    // Procesar cada entrada
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === 'leadgen') {
          await processLeadgenWebhook(change.value)
        }
      }
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Error processing Facebook webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processLeadgenWebhook(value: any) {
  try {
    const leadgenId = value.leadgen_id
    const formId = value.form_id
    const adId = value.ad_id
    const campaignId = value.campaign_id

    // Obtener detalles del lead desde Facebook
    const facebookService = new FacebookService(process.env.FACEBOOK_ACCESS_TOKEN!)
    const leads = await facebookService.getLeads(formId)
    const leadData = leads.find(lead => lead.id === leadgenId)

    if (!leadData) {
      console.error('Lead not found:', leadgenId)
      return
    }

    // Parsear datos del lead
    const parsedData = FacebookService.parseLeadData(leadData)

    // Analizar con IA
    const aiAnalysis = await OpenAIService.analyzeLead(parsedData)

    // Guardar en base de datos
    const savedLead = await prisma.lead.create({
      data: {
        facebookId: leadgenId,
        name: parsedData.name,
        email: parsedData.email,
        phone: parsedData.phone,
        age: parsedData.age,
        gender: parsedData.gender,
        location: parsedData.location,
        interests: parsedData.interests || [],
        aiScore: aiAnalysis.score,
        aiAnalysis: aiAnalysis as any,
        status: 'NEW',
        userId: 'default-user', // TODO: Obtener del contexto
        campaignId: campaignId
      }
    })

    // Si el score es mayor a 60, enviar notificaciones
    if (aiAnalysis.score >= 60) {
      await sendLeadNotifications(savedLead, aiAnalysis)
    }

    // Log del evento
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        message: `New lead processed: ${leadgenId}`,
        data: {
          leadId: savedLead.id,
          aiScore: aiAnalysis.score,
          whatsappSent: aiAnalysis.score >= 60
        },
        source: 'FACEBOOK_WEBHOOK'
      }
    })

  } catch (error) {
    console.error('Error processing leadgen webhook:', error)
    
    await prisma.systemLog.create({
      data: {
        level: 'ERROR',
        message: 'Failed to process leadgen webhook',
        data: { error: error.message, value },
        source: 'FACEBOOK_WEBHOOK'
      }
    })
  }
}

async function sendLeadNotifications(lead: any, aiAnalysis: any) {
  try {
    const notificationManager = new NotificationManager()
    const result = await notificationManager.sendLeadNotification(lead, aiAnalysis)

    // Actualizar lead si se envió alguna notificación
    if (result.sent) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          whatsappSent: result.services.find(s => s.name === 'WhatsApp')?.success || false,
          whatsappSentAt: result.services.find(s => s.name === 'WhatsApp')?.success ? new Date() : null
        }
      })
    }

    // Registrar interacciones para cada servicio
    for (const service of result.services) {
      if (service.enabled) {
        await prisma.leadInteraction.create({
          data: {
            leadId: lead.id,
            type: service.name === 'WhatsApp' ? 'WHATSAPP_SENT' : 'NOTE_ADDED',
            message: service.success 
              ? `${service.name} notification sent successfully`
              : `${service.name} notification failed`,
            successful: service.success
          }
        })
      }
    }

    console.log(`Lead ${lead.id} notifications:`, {
      sent: result.sent,
      enabledServices: notificationManager.getEnabledServices(),
      disabledServices: notificationManager.getDisabledServices()
    })

  } catch (error) {
    console.error('Error sending lead notifications:', error)
    
    await prisma.leadInteraction.create({
      data: {
        leadId: lead.id,
        type: 'NOTE_ADDED',
        message: 'Failed to send notifications: ' + error.message,
        successful: false
      }
    })
  }
}