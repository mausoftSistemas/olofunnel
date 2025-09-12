# OloFunnel 🚀

Plataforma integral de inteligencia artificial que combina análisis de Facebook Ads, gestión inteligente de leads y análisis de reseñas online.

## 🎯 Funcionalidades Principales

- **Sistema de Leads Inteligente con WhatsApp**: Filtrado automático con IA (puntuación 0-100)
- **Review Intelligence**: Análisis de reseñas de Google Maps, Yelp, Trustpilot, Amazon
- **Motor de IA Avanzado**: Análisis predictivo y recomendaciones automáticas
- **Dashboard Profesional**: Métricas en tiempo real y visualizaciones avanzadas

## 🚀 Deploy con Coolify

Este proyecto está optimizado para deploy automático en Coolify con variables de entorno dinámicas.

### Variables de Entorno Requeridas

```env
# Base
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/olofunnel
REDIS_URL=redis://localhost:6379

# APIs
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
WHATSAPP_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_ID=your_phone_id
OPENAI_API_KEY=your_openai_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
YELP_API_KEY=your_yelp_key
TRUSTPILOT_API_KEY=your_trustpilot_key

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
```

## 🛠️ Instalación Local

```bash
npm install
npm run dev
```

## 📊 Stack Tecnológico

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: PostgreSQL + Redis
- **IA**: OpenAI GPT-4, TensorFlow.js
- **Visualización**: Recharts, D3.js