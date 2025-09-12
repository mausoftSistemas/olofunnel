import { NextRequest, NextResponse } from 'next/server'
import { WhatsAppService } from '@/lib/services/whatsapp'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Verificar webhook de WhatsApp
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified')
    return new NextResponse(challenge)
  }

  return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verificar firma del webhook (opcional pero recomendado)
    const signature = request.headers.get('x-hub-signature-256')
    if (signature && process.env.WHATSAPP_WEBHOOK_SECRET) {
      const rawBody = await request.text()
      const isValid = WhatsAppService.validateWebhookSignature(
        rawBody,
        signature,
        process.env.WHATSAPP_WEBHOOK_SECRET
      )
      
      if (!isValid) {
        return new NextResponse('Invalid signature', { status: 401 })
      }
    }

    // Procesar mensajes de WhatsApp
    const { messages, statuses } = WhatsAppService.parseWebhookPayload(body)

    // Procesar mensajes recibidos
    for (const message of messages || []) {
      await processIncomingMessage(message)
    }

    // Procesar estados de mensajes
    for (const status of statuses || []) {
      await processMessageStatus(status)
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processIncomingMessage(message: any) {
  try {
    const from = message.from
    const messageId = message.id
    const messageType = message.type
    let messageText = ''

    // Extraer texto según el tipo de mensaje
    switch (messageType) {
      case 'text':
        messageText = message.text.body
        break
      case 'button':
        messageText = message.button.text
        break
      case 'interactive':
        messageText = message.interactive.button_reply?.title || 
                     message.interactive.list_reply?.title || ''
        break
      default:
        messageText = `[${messageType.toUpperCase()}]`
    }

    // Buscar lead asociado al número
    const lead = await prisma.lead.findFirst({
      where: {
        phone: {
          contains: from.replace('+', '').slice(-10) // Últimos 10 dígitos
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (lead) {
      // Registrar interacción
      await prisma.leadInteraction.create({
        data: {
          leadId: lead.id,
          type: 'WHATSAPP_RECEIVED',
          message: messageText,
          successful: true
        }
      })

      // Marcar lead como contactado si es la primera respuesta
      if (lead.status === 'NEW') {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { status: 'CONTACTED' }
        })
      }
    }

    // Marcar mensaje como leído
    const whatsappService = new WhatsAppService(
      process.env.WHATSAPP_TOKEN!,
      process.env.WHATSAPP_PHONE_ID!
    )
    await whatsappService.markMessageAsRead(messageId)

    // Log del evento
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        message: `WhatsApp message received from ${from}`,
        data: {
          messageId,
          messageType,
          messageText,
          leadId: lead?.id
        },
        source: 'WHATSAPP_WEBHOOK'
      }
    })

  } catch (error) {
    console.error('Error processing incoming WhatsApp message:', error)
    
    await prisma.systemLog.create({
      data: {
        level: 'ERROR',
        message: 'Failed to process incoming WhatsApp message',
        data: { error: error.message, message },
        source: 'WHATSAPP_WEBHOOK'
      }
    })
  }
}

async function processMessageStatus(status: any) {
  try {
    const messageId = status.id
    const statusType = status.status // sent, delivered, read, failed
    const timestamp = status.timestamp

    // Buscar interacción asociada
    const interaction = await prisma.leadInteraction.findFirst({
      where: {
        type: 'WHATSAPP_SENT',
        // Aquí necesitaríamos almacenar el messageId en la interacción
        // para poder hacer la correlación
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Log del estado
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        message: `WhatsApp message status: ${statusType}`,
        data: {
          messageId,
          statusType,
          timestamp,
          interactionId: interaction?.id
        },
        source: 'WHATSAPP_WEBHOOK'
      }
    })

  } catch (error) {
    console.error('Error processing WhatsApp message status:', error)
  }
}