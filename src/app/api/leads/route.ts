import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const minScore = searchParams.get('minScore')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (minScore) {
      where.aiScore = {
        gte: parseFloat(minScore)
      }
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Obtener leads con paginación
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          campaign: {
            select: {
              id: true,
              name: true
            }
          },
          interactions: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 5
          }
        }
      }),
      prisma.lead.count({ where })
    ])

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, campaignId } = body

    // Validar datos requeridos
    if (!name && !email && !phone) {
      return NextResponse.json(
        { error: 'At least one contact field is required' },
        { status: 400 }
      )
    }

    // Crear lead
    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        campaignId,
        userId: 'default-user', // TODO: Obtener del contexto de autenticación
        status: 'NEW'
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}