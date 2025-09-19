import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ReviewsAggregator } from '@/lib/services/reviews'
import { OpenAIService } from '@/lib/services/openai'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const platform = searchParams.get('platform')
    const sentiment = searchParams.get('sentiment')
    const businessName = searchParams.get('businessName')

    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}
    
    if (platform) {
      where.platform = platform
    }
    
    if (sentiment) {
      where.sentiment = sentiment
    }
    
    if (businessName) {
      where.businessName = {
        contains: businessName,
        mode: 'insensitive'
      }
    }

    // Obtener reseñas con paginación
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          date: 'desc'
        }
      }),
      prisma.review.count({ where })
    ])

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessName, location } = body

    if (!businessName) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      )
    }

    // Inicializar agregador de reseñas
    const aggregator = new ReviewsAggregator(
      process.env.GOOGLE_MAPS_API_KEY!,
      process.env.YELP_API_KEY!,
      process.env.TRUSTPILOT_API_KEY!
    )

    // Obtener reseñas de todas las plataformas
    const reviews = await aggregator.getAllReviews(businessName, location)

    // Procesar y guardar cada reseña
    const savedReviews = []
    
    for (const review of reviews) {
      try {
        // Verificar si ya existe
        const existing = await prisma.review.findUnique({
          where: {
            platform_platformId: {
              platform: review.platform,
              platformId: review.id
            }
          }
        })

        if (existing) {
          continue // Skip si ya existe
        }

        // Analizar con IA
        const aiAnalysis = await OpenAIService.analyzeReview(review)

        // Guardar en base de datos
        const savedReview = await prisma.review.create({
          data: {
            platform: review.platform,
            platformId: review.id,
            businessName: review.businessName,
            businessId: review.businessId,
            rating: review.rating,
            title: review.title,
            content: review.content,
            authorName: review.authorName,
            authorImage: review.authorImage,
            date: review.date,
            sentiment: aiAnalysis.sentiment,
            sentimentScore: aiAnalysis.sentimentScore,
            topics: aiAnalysis.topics,
            aiAnalysis: aiAnalysis as any,
            userId: 'default-user' // TODO: Obtener del contexto
          }
        })

        savedReviews.push(savedReview)
      } catch (error) {
        console.error('Error processing review:', error)
      }
    }

    return NextResponse.json({
      message: `Processed ${reviews.length} reviews, saved ${savedReviews.length} new ones`,
      newReviews: savedReviews.length,
      totalFound: reviews.length
    })
  } catch (error) {
    console.error('Error fetching and analyzing reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}