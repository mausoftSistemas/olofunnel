'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  MessageSquare, 
  Star, 
  BarChart3, 
  Zap, 
  Target,
  TrendingUp,
  Users,
  Shield,
  Smartphone
} from 'lucide-react'

export default function HomePage() {
  const [stats, setStats] = useState({
    leadsProcessed: 0,
    reviewsAnalyzed: 0,
    campaignsOptimized: 0,
    conversionIncrease: 0
  })

  useEffect(() => {
    // Animación de contadores
    const timer = setTimeout(() => {
      setStats({
        leadsProcessed: 15420,
        reviewsAnalyzed: 89340,
        campaignsOptimized: 2847,
        conversionIncrease: 340
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "IA Avanzada",
      description: "Análisis inteligente con puntuación 0-100 para leads de alta calidad"
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "WhatsApp Automático",
      description: "Envío automático de leads calificados con mensajes personalizados"
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "Análisis de Reseñas",
      description: "Monitoreo de Google Maps, Yelp, Trustpilot y Amazon en tiempo real"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Dashboard Profesional",
      description: "Métricas en tiempo real con visualizaciones avanzadas"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                OloFunnel
              </span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Funciones</a>
              <a href="#stats" className="text-gray-600 hover:text-blue-600 transition-colors">Estadísticas</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Precios</a>
            </nav>
            <button className="btn-primary">
              Comenzar Gratis
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                IA que Convierte
              </span>
              <br />
              <span className="text-gray-800">Leads en Ventas</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Plataforma integral que combina análisis de Facebook Ads, gestión inteligente de leads 
              con WhatsApp y análisis de reseñas online. Todo automatizado con IA avanzada.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary text-lg px-8 py-3">
                <Target className="w-5 h-5 mr-2 inline" />
                Probar Gratis 14 Días
              </button>
              <button className="btn-secondary text-lg px-8 py-3">
                <Smartphone className="w-5 h-5 mr-2 inline" />
                Ver Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                {stats.leadsProcessed.toLocaleString()}+
              </div>
              <div className="text-gray-600">Leads Procesados</div>
            </motion.div>
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">
                {stats.reviewsAnalyzed.toLocaleString()}+
              </div>
              <div className="text-gray-600">Reseñas Analizadas</div>
            </motion.div>
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
                {stats.campaignsOptimized.toLocaleString()}+
              </div>
              <div className="text-gray-600">Campañas Optimizadas</div>
            </motion.div>
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="text-3xl md:text-4xl font-bold text-pink-600 mb-2">
                +{stats.conversionIncrease}%
              </div>
              <div className="text-gray-600">Aumento Conversiones</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Funcionalidades Principales
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Todo lo que necesitas para automatizar tu marketing digital y aumentar conversiones
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="card hover:shadow-lg transition-shadow duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="text-blue-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              ¿Listo para 10x tus Conversiones?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Únete a más de 2,000 empresas que ya están automatizando su marketing con IA
            </p>
            <button className="bg-white text-blue-600 font-semibold px-8 py-4 rounded-lg text-lg hover:bg-gray-100 transition-colors">
              <TrendingUp className="w-5 h-5 mr-2 inline" />
              Comenzar Ahora - Gratis
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">OloFunnel</span>
              </div>
              <p className="text-gray-400">
                Automatiza tu marketing digital con inteligencia artificial avanzada.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Funciones</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Precios</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Soporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentación</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Estado</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Acerca de</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 OloFunnel by MauSoft Sistemas. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}