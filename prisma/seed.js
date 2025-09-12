const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Crear usuario por defecto
  const defaultUser = await prisma.user.upsert({
    where: { email: 'admin@olofunnel.com' },
    update: {},
    create: {
      email: 'admin@olofunnel.com',
      name: 'Admin OloFunnel',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'ADMIN'
    }
  })

  console.log('✅ Default user created:', defaultUser.email)

  // Crear campaña de ejemplo
  const sampleCampaign = await prisma.campaign.upsert({
    where: { facebookId: 'sample_campaign_123' },
    update: {},
    create: {
      name: 'Campaña de Prueba - Marketing Digital',
      facebookId: 'sample_campaign_123',
      status: 'ACTIVE',
      budget: 1000.0,
      objective: 'LEAD_GENERATION',
      targetAge: '25-45',
      targetGender: 'ALL',
      targetLocation: 'Mexico',
      userId: defaultUser.id
    }
  })

  console.log('✅ Sample campaign created:', sampleCampaign.name)

  // Crear leads de ejemplo
  const sampleLeads = [
    {
      name: 'María González',
      email: 'maria.gonzalez@email.com',
      phone: '+52 55 1234 5678',
      age: 32,
      gender: 'FEMALE',
      location: 'Mexico City, Mexico',
      interests: ['marketing', 'business', 'entrepreneurship'],
      aiScore: 92.5,
      status: 'NEW',
      userId: defaultUser.id,
      campaignId: sampleCampaign.id
    },
    {
      name: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@email.com',
      phone: '+52 55 9876 5432',
      age: 28,
      gender: 'MALE',
      location: 'Guadalajara, Mexico',
      interests: ['technology', 'marketing'],
      aiScore: 78.3,
      status: 'CONTACTED',
      userId: defaultUser.id,
      campaignId: sampleCampaign.id
    },
    {
      name: 'Ana Martínez',
      email: 'ana.martinez@email.com',
      phone: '+52 55 5555 1234',
      age: 35,
      gender: 'FEMALE',
      location: 'Monterrey, Mexico',
      interests: ['business', 'finance'],
      aiScore: 85.7,
      status: 'QUALIFIED',
      userId: defaultUser.id,
      campaignId: sampleCampaign.id
    }
  ]

  for (const leadData of sampleLeads) {
    const lead = await prisma.lead.create({
      data: {
        ...leadData,
        aiAnalysis: {
          score: leadData.aiScore,
          confidence: 89.5,
          factors: ['Edad ideal para el producto', 'Alto engagement', 'Intereses relevantes'],
          priority: leadData.aiScore >= 80 ? 'HIGH' : 'MEDIUM',
          recommendation: 'Lead de alta calidad, contactar inmediatamente'
        }
      }
    })

    console.log('✅ Sample lead created:', lead.name)
  }

  // Crear reseñas de ejemplo
  const sampleReviews = [
    {
      platform: 'GOOGLE_MAPS',
      platformId: 'gm_sample_1',
      businessName: 'Restaurante El Buen Sabor',
      businessId: 'place_123',
      rating: 5,
      title: 'Excelente servicio',
      content: 'La comida estuvo deliciosa y el servicio fue excepcional. Definitivamente regresaré.',
      authorName: 'Juan Pérez',
      date: new Date('2024-01-15'),
      sentiment: 'POSITIVE',
      sentimentScore: 0.9,
      topics: ['servicio', 'comida', 'calidad'],
      userId: defaultUser.id
    },
    {
      platform: 'YELP',
      platformId: 'yelp_sample_1',
      businessName: 'Café Central',
      businessId: 'cafe_central_123',
      rating: 2,
      content: 'El café estaba frío y el servicio muy lento. No recomiendo este lugar.',
      authorName: 'María López',
      date: new Date('2024-01-10'),
      sentiment: 'NEGATIVE',
      sentimentScore: -0.7,
      topics: ['servicio', 'calidad', 'tiempo de espera'],
      userId: defaultUser.id
    },
    {
      platform: 'TRUSTPILOT',
      platformId: 'tp_sample_1',
      businessName: 'TechSolutions SA',
      businessId: 'techsolutions_123',
      rating: 4,
      title: 'Buen producto',
      content: 'El software funciona bien, aunque podría mejorar la interfaz de usuario.',
      authorName: 'Roberto Silva',
      date: new Date('2024-01-12'),
      sentiment: 'POSITIVE',
      sentimentScore: 0.6,
      topics: ['producto', 'interfaz', 'funcionalidad'],
      userId: defaultUser.id
    }
  ]

  for (const reviewData of sampleReviews) {
    const review = await prisma.review.create({
      data: {
        ...reviewData,
        aiAnalysis: {
          sentiment: reviewData.sentiment,
          sentimentScore: reviewData.sentimentScore,
          topics: reviewData.topics,
          summary: 'Análisis automático de reseña',
          actionItems: ['Monitorear tendencias', 'Responder si es necesario']
        }
      }
    })

    console.log('✅ Sample review created for:', review.businessName)
  }

  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })