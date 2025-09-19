import axios from 'axios'

export interface WhatsAppMessage {
  to: string
  type: 'text' | 'template'
  text?: {
    body: string
  }
  template?: {
    name: string
    language: {
      code: string
    }
    components?: any[]
  }
}

export interface WhatsAppResponse {
  messaging_product: string
  contacts: Array<{
    input: string
    wa_id: string
  }>
  messages: Array<{
    id: string
  }>
}

export class WhatsAppService {
  private accessToken: string
  private phoneNumberId: string
  private baseUrl = 'https://graph.facebook.com/v18.0'
  private isEnabled: boolean

  constructor(accessToken?: string, phoneNumberId?: string) {
    this.accessToken = accessToken || ''
    this.phoneNumberId = phoneNumberId || ''
    this.isEnabled = !!(accessToken && phoneNumberId)
  }

  isWhatsAppEnabled(): boolean {
    return this.isEnabled
  }

  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    if (!this.isEnabled) {
      console.log('WhatsApp is disabled - message would be sent:', message)
      return {
        messaging_product: 'whatsapp',
        contacts: [{ input: message.to, wa_id: message.to }],
        messages: [{ id: 'disabled-' + Date.now() }]
      }
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          ...message
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return response.data
    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
      throw new Error('Failed to send WhatsApp message')
    }
  }

  async sendTextMessage(to: string, text: string): Promise<WhatsAppResponse> {
    // Limpiar número de teléfono
    const cleanPhone = this.cleanPhoneNumber(to)
    
    return this.sendMessage({
      to: cleanPhone,
      type: 'text',
      text: {
        body: text
      }
    })
  }

  async sendTemplateMessage(
    to: string, 
    templateName: string, 
    languageCode: string = 'es',
    components?: any[]
  ): Promise<WhatsAppResponse> {
    const cleanPhone = this.cleanPhoneNumber(to)
    
    return this.sendMessage({
      to: cleanPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        },
        components
      }
    })
  }

  async sendLeadNotification(
    to: string, 
    leadData: any, 
    aiScore: number
  ): Promise<WhatsAppResponse> {
    const message = this.formatLeadMessage(leadData, aiScore)
    return this.sendTextMessage(to, message)
  }

  private formatLeadMessage(leadData: any, aiScore: number): string {
    const priority = aiScore >= 80 ? 'ALTA' : aiScore >= 60 ? 'MEDIA' : 'BAJA'
    const emoji = aiScore >= 80 ? '🔥' : aiScore >= 60 ? '⭐' : '📋'
    
    return `
${emoji} NUEVO LEAD CALIFICADO - OloFunnel

👤 Información del Lead:
• Nombre: ${leadData.name || 'No disponible'}
• Email: ${leadData.email || 'No disponible'}
• Teléfono: ${leadData.phone || 'No disponible'}
• Edad: ${leadData.age || 'No disponible'}
• Ubicación: ${leadData.location || 'No disponible'}

🎯 Calificación IA:
• Puntuación: ${aiScore}/100
• Prioridad: ${priority}
• Confianza: ${Math.round(aiScore * 0.9)}%

💡 Factores de Calificación:
${leadData.interests ? `• Intereses: ${leadData.interests.join(', ')}` : '• Intereses: No disponible'}
${leadData.location ? `• Ubicación prioritaria` : ''}
${leadData.email && leadData.phone ? `• Datos de contacto completos` : ''}

📊 Origen:
• Campaña: ${leadData.campaignName || 'Facebook Ads'}
• Formulario: ${leadData.formName || 'Lead Form'}

¡Contacta este lead lo antes posible! 🚀
    `.trim()
  }

  private cleanPhoneNumber(phone: string): string {
    // Remover todos los caracteres no numéricos excepto el +
    let cleaned = phone.replace(/[^\d+]/g, '')
    
    // Si no empieza con +, agregar código de país por defecto (México)
    if (!cleaned.startsWith('+')) {
      // Si empieza con 52, asumir que ya tiene código de país
      if (cleaned.startsWith('52')) {
        cleaned = '+' + cleaned
      } else {
        // Agregar código de país de México
        cleaned = '+52' + cleaned
      }
    }
    
    return cleaned
  }

  async getBusinessProfile(): Promise<any> {
    if (!this.isEnabled) {
      return {
        verified_name: 'WhatsApp Disabled',
        display_phone_number: 'N/A',
        quality_rating: 'N/A'
      }
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.phoneNumberId}`,
        {
          params: {
            fields: 'verified_name,display_phone_number,quality_rating'
          },
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      )

      return response.data
    } catch (error) {
      console.error('Error fetching WhatsApp business profile:', error)
      throw new Error('Failed to fetch business profile')
    }
  }

  async markMessageAsRead(messageId: string): Promise<boolean> {
    if (!this.isEnabled) {
      console.log('WhatsApp is disabled - would mark message as read:', messageId)
      return true
    }

    try {
      await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return true
    } catch (error) {
      console.error('Error marking message as read:', error)
      return false
    }
  }

  static validateWebhookSignature(
    payload: string, 
    signature: string, 
    secret: string
  ): boolean {
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    
    return signature === `sha256=${expectedSignature}`
  }

  static parseWebhookPayload(payload: any): {
    messages?: any[]
    statuses?: any[]
    contacts?: any[]
  } {
    const entry = payload.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    return {
      messages: value?.messages || [],
      statuses: value?.statuses || [],
      contacts: value?.contacts || []
    }
  }
}