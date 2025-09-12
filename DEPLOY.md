# 🚀 Guía de Deploy - OloFunnel

## Deploy en Coolify

### 1. Preparación del Repositorio

```bash
# Clonar el repositorio
git clone https://github.com/mausoftSistemas/olofunnel.git
cd olofunnel

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
```

### 2. Variables de Entorno Requeridas

En Coolify, configura estas variables de entorno:

#### Base
```
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

#### Base de Datos
```
DATABASE_URL=postgresql://usuario:password@postgres:5432/olofunnel
REDIS_URL=redis://redis:6379
POSTGRES_USER=olofunnel
POSTGRES_PASSWORD=tu_password_seguro
```

#### APIs de Facebook
```
FACEBOOK_APP_ID=tu_facebook_app_id
FACEBOOK_APP_SECRET=tu_facebook_app_secret
FACEBOOK_ACCESS_TOKEN=tu_token_de_acceso_largo
FACEBOOK_WEBHOOK_VERIFY_TOKEN=tu_token_verificacion
```

#### WhatsApp Business API
```
WHATSAPP_TOKEN=tu_whatsapp_business_token
WHATSAPP_PHONE_ID=tu_numero_telefono_id
WHATSAPP_VERIFY_TOKEN=tu_webhook_verify_token
WHATSAPP_NOTIFICATION_NUMBER=+5215512345678
```

#### OpenAI
```
OPENAI_API_KEY=sk-tu_openai_api_key
```

#### APIs de Reseñas
```
GOOGLE_MAPS_API_KEY=tu_google_maps_key
YELP_API_KEY=tu_yelp_api_key
TRUSTPILOT_API_KEY=tu_trustpilot_key
```

#### Seguridad
```
JWT_SECRET=tu_jwt_secret_muy_seguro_de_32_caracteres
ENCRYPTION_KEY=tu_clave_encriptacion_32_caracteres
```

### 3. Configuración en Coolify

1. **Crear Nueva Aplicación**
   - Tipo: Docker
   - Repositorio: https://github.com/mausoftSistemas/olofunnel
   - Branch: main

2. **Configurar Build**
   - Dockerfile: `Dockerfile`
   - Puerto: `3000`
   - Health Check: `/api/health`

3. **Servicios Adicionales**
   - PostgreSQL 15
   - Redis 7

4. **Volúmenes**
   - `olofunnel_postgres` → `/var/lib/postgresql/data`
   - `olofunnel_redis` → `/data`
   - `olofunnel_uploads` → `/app/uploads`

### 4. Configuración de APIs Externas

#### Facebook Developers
1. Crear app en https://developers.facebook.com
2. Configurar Marketing API
3. Configurar Webhooks para Lead Ads
4. Obtener tokens de acceso de larga duración

#### WhatsApp Business API
1. Configurar en Facebook Business
2. Verificar número de teléfono
3. Configurar webhooks
4. Obtener tokens de acceso

#### Google Cloud Platform
1. Habilitar Maps API y Places API
2. Crear credenciales API Key
3. Configurar restricciones de dominio

#### Yelp Developers
1. Crear app en https://www.yelp.com/developers
2. Obtener API Key

#### Trustpilot
1. Solicitar acceso a API
2. Configurar credenciales

### 5. Post-Deploy

#### Inicializar Base de Datos
```bash
# Ejecutar migraciones
npx prisma migrate deploy

# Generar cliente Prisma
npx prisma generate

# Poblar datos iniciales (opcional)
npm run db:seed
```

#### Configurar Webhooks
1. **Facebook Lead Ads**
   - URL: `https://tu-dominio.com/api/webhooks/facebook`
   - Verify Token: Tu `FACEBOOK_WEBHOOK_VERIFY_TOKEN`

2. **WhatsApp Business**
   - URL: `https://tu-dominio.com/api/webhooks/whatsapp`
   - Verify Token: Tu `WHATSAPP_VERIFY_TOKEN`

### 6. Verificación del Deploy

#### Health Check
```bash
curl https://tu-dominio.com/api/health
```

Respuesta esperada:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

#### Test de APIs
```bash
# Test de leads
curl https://tu-dominio.com/api/leads

# Test de reseñas
curl https://tu-dominio.com/api/reviews
```

### 7. Monitoreo y Logs

#### Logs de Aplicación
```bash
# En Coolify, revisar logs del contenedor
docker logs olofunnel-app

# Logs de base de datos
docker logs olofunnel-postgres
```

#### Métricas Importantes
- Tiempo de respuesta de APIs
- Uso de memoria y CPU
- Conexiones a base de datos
- Rate limits de APIs externas

### 8. Backup y Recuperación

#### Backup de Base de Datos
```bash
# Backup automático diario
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

#### Backup de Configuración
- Variables de entorno
- Configuración de webhooks
- Credenciales de APIs

### 9. Escalabilidad

#### Horizontal Scaling
- Múltiples instancias de la aplicación
- Load balancer
- Redis para sesiones compartidas

#### Vertical Scaling
- Aumentar recursos de CPU/RAM
- Optimizar queries de base de datos
- Cache de respuestas frecuentes

### 10. Troubleshooting

#### Problemas Comunes

**Error de conexión a base de datos**
```bash
# Verificar conexión
docker exec -it olofunnel-postgres psql -U olofunnel -d olofunnel
```

**Webhooks no funcionan**
- Verificar URLs públicas
- Revisar tokens de verificación
- Comprobar logs de aplicación

**APIs externas fallan**
- Verificar límites de rate
- Comprobar credenciales
- Revisar logs de errores

#### Logs Útiles
```bash
# Logs de aplicación
docker logs -f olofunnel-app

# Logs de base de datos
docker logs -f olofunnel-postgres

# Logs de Redis
docker logs -f olofunnel-redis
```

### 11. Actualizaciones

#### Deploy de Nueva Versión
1. Push cambios a repositorio
2. Coolify detecta cambios automáticamente
3. Build y deploy automático
4. Verificar health check

#### Rollback
1. En Coolify, seleccionar versión anterior
2. Deploy de versión estable
3. Verificar funcionamiento

---

## 🔧 Comandos Útiles

```bash
# Desarrollo local
npm run dev

# Build de producción
npm run build

# Iniciar en producción
npm start

# Migraciones de base de datos
npx prisma migrate dev
npx prisma migrate deploy

# Generar cliente Prisma
npx prisma generate

# Poblar base de datos
npm run db:seed

# Linting
npm run lint
```

## 📞 Soporte

Para soporte técnico:
- Email: soporte@mausoft.com
- GitHub Issues: https://github.com/mausoftSistemas/olofunnel/issues
- Documentación: https://docs.olofunnel.com