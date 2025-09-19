import { WhatsAppService } from './whatsapp'
import { prisma } from '@/lib/prisma'

export interface NotificationService {
  sendLeadNotification(lead: any, aiAnalysis: any): Promise<boolean>
  isEnabled(): boolean
  getServiceName(): string
}

export class WhatsAppNotificationService implements NotificationService {
  private whatsappService: WhatsAppService

  constructor() {
    this.whatsappService = new WhatsAppService(
      process.env.WHATSAPP_TOKEN,
      process.env.WHATSAPP_PHONE_ID
    )
  }

  isEnabled(): boolean {
    return this.whatsappService.isWhatsAppEnabled()
  }

  getServiceName(): string {
    return 'WhatsApp'
  }

  async sendLeadNotification(lead: any, aiAnalysis: any): Promise<boolean> {
    if (!this.isEnabled()) {
      return false
    }

    try {
      const message = await this.generateMessage(lead, aiAnalysis)
      const userPhone = process.env.WHATSAPP_NOTIFICATION_NUMBER || '+5215512345678'
      
      await this.whatsappService.sendTextMessage(userPhone, message)
      return true
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error)
      return false
    }
  }

  private async generateMessage(lead: any, aiAnalysis: any): Promise<string> {
    const priority = aiAnalysis.score >= 80 ? 'ALTA' : aiAnalysis.score >= 60 ? 'MEDIA' : 'BAJA'
    const emoji = aiAnalysis.score >= 80 ? '🔥' : aiAnalysis.score >= 60 ? '⭐' : '📋'
    
    return `
${emoji} NUEVO LEAD CALIFICADO - OloFunnel

👤 Información del Lead:
• Nombre: ${lead.name || 'No disponible'}
• Email: ${lead.email || 'No disponible'}
• Teléfono: ${lead.phone || 'No disponible'}
• Ubicación: ${lead.location || 'No disponible'}

🎯 Calificación IA:
• Puntuación: ${aiAnalysis.score}/100
• Prioridad: ${priority}
• Confianza: ${Math.round(aiAnalysis.confidence || 85)}%

💡 Factores de Calificación:
${aiAnalysis.factors?.slice(0, 3).map((f: string) => `• ${f}`).join('\n') || '• Análisis completado'}

📊 Origen: Facebook Ads
¡Contacta este lead lo antes posible! 🚀
    `.trim()
  }
}

export class EmailNotificationService implements NotificationService {
  isEnabled(): boolean {
    return !!(process.env.SMTP_HOST && process.env.SMTP_USER)
  }

  getServiceName(): string {
    return 'Email'
  }

  async sendLeadNotification(lead: any, aiAnalysis: any): Promise<boolean> {
    if (!this.isEnabled()) {
      return false
    }

    // TODO: Implementar envío de email
    console.log('Email notification would be sent for lead:', lead.id)
    return true
  }
}

export class DatabaseNotificationService implements NotificationService {
  isEnabled(): boolean {
    return true // Siempre disponible
  }

  getServiceName(): string {
    return 'Database Log'
  }

  async sendLeadNotification(lead: any, aiAnalysis: any): Promise<boolean> {
    try {
      await prisma.systemLog.create({
        data: {
          level: 'INFO',
          message: `High-quality lead detected: ${lead.name || 'Unknown'} (Score: ${aiAnalysis.score}/100)`,
          data: {
            leadId: lead.id,
            aiScore: aiAnalysis.score,
            priority: aiAnalysis.score >= 80 ? 'HIGH' : 'MEDIUM',
            leadData: {
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              location: lead.location
            }
          },
          source: 'LEAD_NOTIFICATION',
          userId: lead.userId
        }
      })
      return true
    } catch (error) {
      console.error('Error saving notification to database:', error)
      return false
    }
  }
}

export class NotificationManager {
  private services: NotificationService[]

  constructor() {
    this.services = [
      new WhatsAppNotificationService(),
      new EmailNotificationService(),
      new DatabaseNotificationService()
    ]
  }

  async sendLeadNotification(lead: any, aiAnalysis: any): Promise<{
    sent: boolean
    services: Array<{ name: string; success: boolean; enabled: boolean }>
  }> {
    const results = []
    let anySent = false

    for (const service of this.services) {
      const enabled = service.isEnabled()
      let success = false

      if (enabled) {
        try {
          success = await service.sendLeadNotification(lead, aiAnalysis)
          if (success) anySent = true
        } catch (error) {
          console.error(`Error with ${service.getServiceName()} notification:`, error)
          success = false
        }
      }

      results.push({
        name: service.getServiceName(),
        success,
        enabled
      })
    }

    return {
      sent: anySent,
      services: results
    }
  }

  getEnabledServices(): string[] {
    return this.services
      .filter(service => service.isEnabled())
      .map(service => service.getServiceName())
  }

  getDisabledServices(): string[] {
    return this.services
      .filter(service => !service.isEnabled())
      .map(service => service.getServiceName())
  }
}