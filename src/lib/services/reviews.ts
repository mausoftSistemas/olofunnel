import axios from 'axios'

export interface Review {
  id: string
  platform: 'GOOGLE_MAPS' | 'YELP' | 'TRUSTPILOT' | 'AMAZON'
  businessName: string
  businessId?: string
  rating: number
  title?: string
  content: string
  authorName?: string
  authorImage?: string
  date: Date
  url?: string
}

export interface BusinessInfo {
  id: string
  name: string
  address?: string
  phone?: string
  website?: string
  rating?: number
  reviewCount?: number
}

export class GoogleMapsService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async searchBusiness(query: string): Promise<BusinessInfo[]> {
    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/textsearch/json',
        {
          params: {
            query,
            key: this.apiKey,
            fields: 'place_id,name,formatted_address,rating,user_ratings_total'
          }
        }
      )

      return response.data.results.map((place: any) => ({
        id: place.place_id,
        name: place.name,
        address: place.formatted_address,
        rating: place.rating,
        reviewCount: place.user_ratings_total
      }))
    } catch (error) {
      console.error('Error searching Google Maps business:', error)
      throw new Error('Failed to search business on Google Maps')
    }
  }

  async getBusinessDetails(placeId: string): Promise<BusinessInfo> {
    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: {
            place_id: placeId,
            key: this.apiKey,
            fields: 'place_id,name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,reviews'
          }
        }
      )

      const place = response.data.result
      return {
        id: place.place_id,
        name: place.name,
        address: place.formatted_address,
        phone: place.formatted_phone_number,
        website: place.website,
        rating: place.rating,
        reviewCount: place.user_ratings_total
      }
    } catch (error) {
      console.error('Error fetching Google Maps business details:', error)
      throw new Error('Failed to fetch business details')
    }
  }

  async getReviews(placeId: string): Promise<Review[]> {
    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: {
            place_id: placeId,
            key: this.apiKey,
            fields: 'name,reviews'
          }
        }
      )

      const place = response.data.result
      const reviews = place.reviews || []

      return reviews.map((review: any) => ({
        id: `gm_${placeId}_${review.time}`,
        platform: 'GOOGLE_MAPS' as const,
        businessName: place.name,
        businessId: placeId,
        rating: review.rating,
        content: review.text,
        authorName: review.author_name,
        authorImage: review.profile_photo_url,
        date: new Date(review.time * 1000)
      }))
    } catch (error) {
      console.error('Error fetching Google Maps reviews:', error)
      throw new Error('Failed to fetch reviews from Google Maps')
    }
  }
}

export class YelpService {
  private apiKey: string
  private baseUrl = 'https://api.yelp.com/v3'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async searchBusiness(term: string, location: string): Promise<BusinessInfo[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/businesses/search`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          params: {
            term,
            location,
            limit: 20
          }
        }
      )

      return response.data.businesses.map((business: any) => ({
        id: business.id,
        name: business.name,
        address: business.location.display_address.join(', '),
        phone: business.phone,
        rating: business.rating,
        reviewCount: business.review_count
      }))
    } catch (error) {
      console.error('Error searching Yelp business:', error)
      throw new Error('Failed to search business on Yelp')
    }
  }

  async getBusinessDetails(businessId: string): Promise<BusinessInfo> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/businesses/${businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      )

      const business = response.data
      return {
        id: business.id,
        name: business.name,
        address: business.location.display_address.join(', '),
        phone: business.phone,
        website: business.url,
        rating: business.rating,
        reviewCount: business.review_count
      }
    } catch (error) {
      console.error('Error fetching Yelp business details:', error)
      throw new Error('Failed to fetch business details from Yelp')
    }
  }

  async getReviews(businessId: string): Promise<Review[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/businesses/${businessId}/reviews`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      )

      const businessDetails = await this.getBusinessDetails(businessId)

      return response.data.reviews.map((review: any) => ({
        id: `yelp_${businessId}_${review.id}`,
        platform: 'YELP' as const,
        businessName: businessDetails.name,
        businessId,
        rating: review.rating,
        content: review.text,
        authorName: review.user.name,
        authorImage: review.user.image_url,
        date: new Date(review.time_created),
        url: review.url
      }))
    } catch (error) {
      console.error('Error fetching Yelp reviews:', error)
      throw new Error('Failed to fetch reviews from Yelp')
    }
  }
}

export class TrustpilotService {
  private apiKey: string
  private baseUrl = 'https://api.trustpilot.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async searchBusiness(query: string): Promise<BusinessInfo[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/business-units/search`,
        {
          headers: {
            'apikey': this.apiKey
          },
          params: {
            query,
            limit: 20
          }
        }
      )

      return response.data.businessUnits.map((business: any) => ({
        id: business.id,
        name: business.displayName,
        website: business.websiteUrl,
        rating: business.trustScore,
        reviewCount: business.numberOfReviews
      }))
    } catch (error) {
      console.error('Error searching Trustpilot business:', error)
      throw new Error('Failed to search business on Trustpilot')
    }
  }

  async getReviews(businessId: string): Promise<Review[]> {
    try {
      const [businessResponse, reviewsResponse] = await Promise.all([
        axios.get(`${this.baseUrl}/business-units/${businessId}`, {
          headers: { 'apikey': this.apiKey }
        }),
        axios.get(`${this.baseUrl}/business-units/${businessId}/reviews`, {
          headers: { 'apikey': this.apiKey },
          params: { perPage: 100 }
        })
      ])

      const business = businessResponse.data
      const reviews = reviewsResponse.data.reviews

      return reviews.map((review: any) => ({
        id: `tp_${businessId}_${review.id}`,
        platform: 'TRUSTPILOT' as const,
        businessName: business.displayName,
        businessId,
        rating: review.stars,
        title: review.title,
        content: review.text,
        authorName: review.consumer.displayName,
        date: new Date(review.createdAt),
        url: review.url
      }))
    } catch (error) {
      console.error('Error fetching Trustpilot reviews:', error)
      throw new Error('Failed to fetch reviews from Trustpilot')
    }
  }
}

export class ReviewsAggregator {
  private googleMaps: GoogleMapsService
  private yelp: YelpService
  private trustpilot: TrustpilotService

  constructor(
    googleMapsKey: string,
    yelpKey: string,
    trustpilotKey: string
  ) {
    this.googleMaps = new GoogleMapsService(googleMapsKey)
    this.yelp = new YelpService(yelpKey)
    this.trustpilot = new TrustpilotService(trustpilotKey)
  }

  async getAllReviews(businessName: string, location?: string): Promise<Review[]> {
    const allReviews: Review[] = []

    try {
      // Google Maps
      const gmBusinesses = await this.googleMaps.searchBusiness(businessName)
      if (gmBusinesses.length > 0) {
        const gmReviews = await this.googleMaps.getReviews(gmBusinesses[0].id)
        allReviews.push(...gmReviews)
      }
    } catch (error) {
      console.error('Error fetching Google Maps reviews:', error)
    }

    try {
      // Yelp
      if (location) {
        const yelpBusinesses = await this.yelp.searchBusiness(businessName, location)
        if (yelpBusinesses.length > 0) {
          const yelpReviews = await this.yelp.getReviews(yelpBusinesses[0].id)
          allReviews.push(...yelpReviews)
        }
      }
    } catch (error) {
      console.error('Error fetching Yelp reviews:', error)
    }

    try {
      // Trustpilot
      const tpBusinesses = await this.trustpilot.searchBusiness(businessName)
      if (tpBusinesses.length > 0) {
        const tpReviews = await this.trustpilot.getReviews(tpBusinesses[0].id)
        allReviews.push(...tpReviews)
      }
    } catch (error) {
      console.error('Error fetching Trustpilot reviews:', error)
    }

    return allReviews
  }

  static analyzeReviewTrends(reviews: Review[]): {
    totalReviews: number
    averageRating: number
    sentimentDistribution: {
      positive: number
      negative: number
      neutral: number
    }
    platformDistribution: Record<string, number>
    monthlyTrends: Array<{
      month: string
      count: number
      averageRating: number
    }>
  } {
    const totalReviews = reviews.length
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews

    // Distribución de sentimientos
    const sentimentDistribution = {
      positive: reviews.filter(r => r.rating >= 4).length,
      negative: reviews.filter(r => r.rating <= 2).length,
      neutral: reviews.filter(r => r.rating === 3).length
    }

    // Distribución por plataforma
    const platformDistribution = reviews.reduce((acc, review) => {
      acc[review.platform] = (acc[review.platform] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Tendencias mensuales
    const monthlyData = reviews.reduce((acc, review) => {
      const monthKey = review.date.toISOString().substring(0, 7) // YYYY-MM
      if (!acc[monthKey]) {
        acc[monthKey] = { count: 0, totalRating: 0 }
      }
      acc[monthKey].count++
      acc[monthKey].totalRating += review.rating
      return acc
    }, {} as Record<string, { count: number; totalRating: number }>)

    const monthlyTrends = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        count: data.count,
        averageRating: data.totalRating / data.count
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    return {
      totalReviews,
      averageRating,
      sentimentDistribution,
      platformDistribution,
      monthlyTrends
    }
  }
}