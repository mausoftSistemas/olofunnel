import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const businessName = searchParams.get('businessName')
    const platform = searchParams.get('platform')
    const days = parseInt(searchParams.get('days') || '30')

    // Fecha de inicio para el filtro
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Construir filtros base
    const where: any = {
      date: {
        gte: startDate
      }
    }

    if (businessName) {
      where.businessName = {
        contains: businessName,
        mode: 'insensitive'
      }
    }

    if (platform) {
      where.platform = platform
    }

    // Obtener todas las reseñas para análisis
    const reviews = await prisma.review.findMany({
      where,
      orderBy: {
        date: 'desc'
      }
    })

    // Análisis general
    const totalReviews = reviews.length
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
      : 0

    // Distribución de sentimientos
    const sentimentDistribution = {
      positive: reviews.filter(r => r.sentiment === 'POSITIVE').length,
      negative: reviews.filter(r => r.sentiment === 'NEGATIVE').length,
      neutral: reviews.filter(r => r.sentiment === 'NEUTRAL').length
    }

    // Distribución por rating
    const ratingDistribution = {
      1: reviews.filter(r => r.rating === 1).length,
      2: reviews.filter(r => r.rating === 2).length,
      3: reviews.filter(r => r.rating === 3).length,
      4: reviews.filter(r => r.rating === 4).length,
      5: reviews.filter(r => r.rating === 5).length
    }

    // Distribución por plataforma
    const platformDistribution = reviews.reduce((acc, review) => {
      acc[review.platform] = (acc[review.platform] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Tendencias diarias
    const dailyTrends = reviews.reduce((acc, review) => {
      const dateKey = review.date.toISOString().split('T')[0] // YYYY-MM-DD
      if (!acc[dateKey]) {
        acc[dateKey] = { count: 0, totalRating: 0, positive: 0, negative: 0 }
      }
      acc[dateKey].count++
      acc[dateKey].totalRating += review.rating
      if (review.sentiment === 'POSITIVE') acc[dateKey].positive++
      if (review.sentiment === 'NEGATIVE') acc[dateKey].negative++
      return acc
    }, {} as Record<string, any>)

    const dailyTrendsArray = Object.entries(dailyTrends)
      .map(([date, data]) => ({
        date,
        count: data.count,
        averageRating: data.totalRating / data.count,
        positive: data.positive,
        negative: data.negative
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Temas más mencionados
    const allTopics = reviews.flatMap(r => r.topics || [])
    const topicCounts = allTopics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topTopics = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }))

    // Reseñas más recientes (positivas y negativas)
    const recentPositive = reviews
      .filter(r => r.sentiment === 'POSITIVE')
      .slice(0, 5)

    const recentNegative = reviews
      .filter(r => r.sentiment === 'NEGATIVE')
      .slice(0, 5)

    // Análisis de competencia (si hay múltiples negocios)
    const businessComparison = reviews.reduce((acc, review) => {
      const business = review.businessName
      if (!acc[business]) {
        acc[business] = {
          name: business,
          totalReviews: 0,
          averageRating: 0,
          totalRating: 0,
          positive: 0,
          negative: 0
        }
      }
      acc[business].totalReviews++
      acc[business].totalRating += review.rating
      acc[business].averageRating = acc[business].totalRating / acc[business].totalReviews
      if (review.sentiment === 'POSITIVE') acc[business].positive++
      if (review.sentiment === 'NEGATIVE') acc[business].negative++
      return acc
    }, {} as Record<string, any>)

    const businessComparisonArray = Object.values(businessComparison)
      .sort((a: any, b: any) => b.averageRating - a.averageRating)

    return NextResponse.json({
      summary: {
        totalReviews,
        averageRating: Math.round(averageRating * 100) / 100,
        period: `${days} days`,
        lastUpdated: new Date().toISOString()
      },
      sentimentDistribution,
      ratingDistribution,
      platformDistribution,
      dailyTrends: dailyTrendsArray,
      topTopics,
      recentReviews: {
        positive: recentPositive,
        negative: recentNegative
      },
      businessComparison: businessComparisonArray,
      insights: generateInsights(reviews, sentimentDistribution, topTopics)
    })
  } catch (error) {
    console.error('Error generating reviews analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateInsights(
  reviews: any[], 
  sentimentDistribution: any, 
  topTopics: any[]
): string[] {
  const insights = []
  const totalReviews = reviews.length

  if (totalReviews === 0) {
    return ['No hay suficientes datos para generar insights']
  }

  // Insight sobre sentimiento general
  const positivePercentage = (sentimentDistribution.positive / totalReviews) * 100
  if (positivePercentage > 70) {
    insights.push(`Excelente reputación online con ${Math.round(positivePercentage)}% de reseñas positivas`)
  } else if (positivePercentage < 40) {
    insights.push(`Atención requerida: solo ${Math.round(positivePercentage)}% de reseñas son positivas`)
  }

  // Insight sobre rating promedio
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
  if (avgRating >= 4.5) {
    insights.push('Rating excepcional, mantener estándares de calidad actuales')
  } else if (avgRating < 3.0) {
    insights.push('Rating bajo requiere acción inmediata para mejorar experiencia del cliente')
  }

  // Insight sobre temas principales
  if (topTopics.length > 0) {
    const topTopic = topTopics[0]
    insights.push(`"${topTopic.topic}" es el tema más mencionado (${topTopic.count} veces)`)
  }

  // Insight sobre tendencia
  const recentReviews = reviews.slice(0, Math.min(10, reviews.length))
  const recentAvg = recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length
  const overallAvg = avgRating
  
  if (recentAvg > overallAvg + 0.3) {
    insights.push('Tendencia positiva: las reseñas recientes muestran mejora')
  } else if (recentAvg < overallAvg - 0.3) {
    insights.push('Tendencia negativa: las reseñas recientes han empeorado')
  }

  return insights
}