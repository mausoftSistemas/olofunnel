import OpenAI from 'openai'

let openai: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

export interface LeadAnalysis {
  score: number
  confidence: number
  factors: string[]
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  recommendation: string
}

export interface ReviewAnalysis {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  sentimentScore: number
  topics: string[]
  summary: string
  actionItems: string[]
}

export class OpenAIService {
  static async analyzeLead(leadData: any): Promise<LeadAnalysis> {
    try {
      // Check if OpenAI is available
      if (!process.env.OPENAI_API_KEY) {
        console.log('OpenAI API key not available, using fallback analysis')
        return {
          score: 50,
          confidence: 30,
          factors: ['OpenAI no configurado - análisis básico'],
          priority: 'MEDIUM',
          recommendation: 'Configurar OpenAI para análisis avanzado'
        }
      }
      const prompt = `
        Analiza este lead de Facebook Ads y proporciona una puntuación de 0-100:
        
        Datos del Lead:
        - Nombre: ${leadData.name || 'No disponible'}
        - Edad: ${leadData.age || 'No disponible'}
        - Género: ${leadData.gender || 'No disponible'}
        - Ubicación: ${leadData.location || 'No disponible'}
        - Intereses: ${leadData.interests?.join(', ') || 'No disponible'}
        - Email: ${leadData.email ? 'Disponible' : 'No disponible'}
        - Teléfono: ${leadData.phone ? 'Disponible' : 'No disponible'}
        
        Criterios de evaluación:
        1. Completitud de datos (30%)
        2. Relevancia de intereses (25%)
        3. Demografía objetivo (20%)
        4. Ubicación geográfica (15%)
        5. Canales de contacto disponibles (10%)
        
        Responde en formato JSON con:
        {
          "score": número entre 0-100,
          "confidence": nivel de confianza 0-100,
          "factors": ["factor1", "factor2", ...],
          "priority": "LOW|MEDIUM|HIGH",
          "recommendation": "texto explicativo"
        }
      `

      const client = getOpenAIClient()
      const response = await client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en análisis de leads de marketing digital. Proporciona análisis precisos y accionables.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('No response from OpenAI')

      return JSON.parse(content) as LeadAnalysis
    } catch (error) {
      console.error('Error analyzing lead with OpenAI:', error)
      // Fallback analysis
      return {
        score: 50,
        confidence: 30,
        factors: ['Análisis automático no disponible'],
        priority: 'MEDIUM',
        recommendation: 'Lead requiere revisión manual'
      }
    }
  }

  static async analyzeReview(reviewData: any): Promise<ReviewAnalysis> {
    try {
      // Check if OpenAI is available
      if (!process.env.OPENAI_API_KEY) {
        console.log('OpenAI API key not available, using fallback analysis')
        const rating = reviewData.rating || 3
        return {
          sentiment: rating >= 4 ? 'POSITIVE' : rating <= 2 ? 'NEGATIVE' : 'NEUTRAL',
          sentimentScore: (rating - 3) / 2,
          topics: ['OpenAI no configurado - análisis básico'],
          summary: 'Análisis básico basado en rating',
          actionItems: ['Configurar OpenAI para análisis avanzado']
        }
      }
      const prompt = `
        Analiza esta reseña y proporciona un análisis detallado:
        
        Reseña:
        - Plataforma: ${reviewData.platform}
        - Rating: ${reviewData.rating}/5
        - Título: ${reviewData.title || 'Sin título'}
        - Contenido: ${reviewData.content}
        - Autor: ${reviewData.authorName || 'Anónimo'}
        
        Proporciona análisis de:
        1. Sentimiento general
        2. Puntuación de sentimiento (-1 a 1)
        3. Temas principales mencionados
        4. Resumen ejecutivo
        5. Acciones recomendadas
        
        Responde en formato JSON con:
        {
          "sentiment": "POSITIVE|NEGATIVE|NEUTRAL",
          "sentimentScore": número entre -1 y 1,
          "topics": ["tema1", "tema2", ...],
          "summary": "resumen breve",
          "actionItems": ["acción1", "acción2", ...]
        }
      `

      const client = getOpenAIClient()
      const response = await client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en análisis de sentimientos y reseñas online. Proporciona análisis precisos y útiles.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 600
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('No response from OpenAI')

      return JSON.parse(content) as ReviewAnalysis
    } catch (error) {
      console.error('Error analyzing review with OpenAI:', error)
      // Fallback analysis
      const rating = reviewData.rating || 3
      return {
        sentiment: rating >= 4 ? 'POSITIVE' : rating <= 2 ? 'NEGATIVE' : 'NEUTRAL',
        sentimentScore: (rating - 3) / 2, // Convierte 1-5 a -1 a 1
        topics: ['Análisis automático no disponible'],
        summary: 'Reseña requiere análisis manual',
        actionItems: ['Revisar manualmente esta reseña']
      }
    }
  }

  static async generateWhatsAppMessage(leadData: any, analysis: LeadAnalysis): Promise<string> {
    try {
      // Check if OpenAI is available
      if (!process.env.OPENAI_API_KEY) {
        console.log('OpenAI API key not available, using template message')
        return `
🔥 NUEVO LEAD CALIFICADO - OloFunnel

👤 Hola ${leadData.name || 'Cliente'},

Nuestro sistema te ha calificado con ${analysis.score}/100 puntos.

📊 Factores de calificación:
${analysis.factors.slice(0, 3).map((f: string) => `• ${f}`).join('\n')}

¿Te gustaría conocer más sobre nuestros servicios?

¡Responde este mensaje para comenzar! 🚀
        `.trim()
      }
      const prompt = `
        Genera un mensaje personalizado de WhatsApp para este lead calificado:
        
        Información del Lead:
        - Nombre: ${leadData.name || 'Cliente'}
        - Puntuación IA: ${analysis.score}/100
        - Prioridad: ${analysis.priority}
        - Factores clave: ${analysis.factors.join(', ')}
        
        El mensaje debe:
        1. Ser profesional pero cercano
        2. Mencionar la puntuación de calificación
        3. Incluir los datos relevantes del lead
        4. Tener un call-to-action claro
        5. Usar emojis apropiados
        6. Máximo 200 palabras
        
        Formato del mensaje para WhatsApp Business.
      `

      const client = getOpenAIClient()
      const response = await client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en marketing conversacional y WhatsApp Business. Crea mensajes que conviertan.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      })

      return response.choices[0]?.message?.content || `
🔥 NUEVO LEAD CALIFICADO - OloFunnel

👤 Hola ${leadData.name || 'Cliente'},

Hemos detectado tu interés en nuestros servicios y nuestro sistema de IA te ha calificado con ${analysis.score}/100 puntos.

📊 Tu perfil indica alta probabilidad de conversión basado en:
${analysis.factors.slice(0, 3).map(f => `• ${f}`).join('\n')}

¿Te gustaría conocer más sobre cómo podemos ayudarte?

¡Responde este mensaje para comenzar! 🚀
      `.trim()
    } catch (error) {
      console.error('Error generating WhatsApp message:', error)
      return `
🔥 NUEVO LEAD CALIFICADO - OloFunnel

👤 Hola ${leadData.name || 'Cliente'},

Gracias por tu interés. Nuestro sistema de IA te ha identificado como un lead de alta calidad con ${analysis.score}/100 puntos.

¿Te gustaría conocer más sobre nuestros servicios?

¡Responde para comenzar! 🚀
      `.trim()
    }
  }
}