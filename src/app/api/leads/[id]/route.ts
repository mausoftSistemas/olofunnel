import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OpenAIService } from '@/lib/services/openai'
import { WhatsAppService } from '@/lib/services/whatsapp'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
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
          }
        }
      }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Error fetching lead:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, email, phone, status, notes } = body

    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        name,
        email,
        phone,
        status,
        updatedAt: new Date()
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
          }
        }
      }
    })

    // Si se agregaron notas, crear una interacción
    if (notes) {
      await prisma.leadInteraction.create({
        data: {
          leadId: params.id,
          type: 'NOTE_ADDED',
          message: notes,
          successful: true
        }
      })
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.lead.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}