import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Verificar conexión a la base de datos
    await prisma.$queryRaw`SELECT 1`
    
    // Verificar variables de entorno críticas
    const requiredEnvVars = [
      'DATABASE_URL',
      'OPENAI_API_KEY'
    ]
    
    // Variables opcionales
    const optionalEnvVars = [
      'FACEBOOK_APP_ID',
      'WHATSAPP_TOKEN',
      'GOOGLE_MAPS_API_KEY'
    ]
    
    const missingEnvVars = requiredEnvVars.filter(
      envVar => !process.env[envVar]
    )
    
    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        { 
          status: 'unhealthy',
          error: `Missing critical environment variables: ${missingEnvVars.join(', ')}`
        },
        { status: 503 }
      )
    }

    // Verificar variables opcionales
    const missingOptionalVars = optionalEnvVars.filter(
      envVar => !process.env[envVar]
    )
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'connected',
        openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
        facebook: process.env.FACEBOOK_APP_ID ? 'configured' : 'disabled',
        whatsapp: process.env.WHATSAPP_TOKEN ? 'configured' : 'disabled',
        googleMaps: process.env.GOOGLE_MAPS_API_KEY ? 'configured' : 'disabled'
      },
      warnings: missingOptionalVars.length > 0 ? 
        `Optional services disabled: ${missingOptionalVars.join(', ')}` : null
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Database connection failed'
      },
      { status: 503 }
    )
  }
}