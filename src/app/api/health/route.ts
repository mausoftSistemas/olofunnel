import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Verificar conexión a la base de datos
    await prisma.$queryRaw`SELECT 1`
    
    // Verificar variables de entorno críticas
    const requiredEnvVars = [
      'DATABASE_URL',
      'OPENAI_API_KEY',
      'FACEBOOK_APP_ID',
      'WHATSAPP_TOKEN'
    ]
    
    const missingEnvVars = requiredEnvVars.filter(
      envVar => !process.env[envVar]
    )
    
    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        { 
          status: 'unhealthy',
          error: `Missing environment variables: ${missingEnvVars.join(', ')}`
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
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