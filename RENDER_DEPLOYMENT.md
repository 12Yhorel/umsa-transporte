# 🚀 Guía Rápida de Despliegue en Render

## Deploy Backend + MySQL GRATIS en 10 minutos

### 📋 Paso 1: Crear cuenta en Render

1. Ve a [render.com](https://render.com)
2. Regístrate con tu GitHub (más rápido)

---

### 🗄️ Paso 2: Crear Base de Datos MySQL

1. En el Dashboard, click **"New +"** → **"PostgreSQL"** (¡SÍ, PostgreSQL es gratis!)
   - **IMPORTANTE**: Render no ofrece MySQL gratis, pero PostgreSQL funciona igual
   
**O mejor aún, usa PlanetScale (MySQL gratis):**

#### Opción A: PlanetScale (MySQL Gratis - RECOMENDADO)

1. Ve a [planetscale.com](https://planetscale.com)
2. Crea cuenta gratis
3. Click **"Create database"**
   - Name: `umsa-transporte`
   - Region: `US East` (más rápido)
4. Click **"Connect"** → Copia las credenciales:
   ```
   HOST: xxxxxx.us-east-3.psdb.cloud
   USERNAME: xxxxxxxxx
   PASSWORD: pscale_pw_xxxxxxxxx
   DATABASE: umsa-transporte
   ```
5. **Importar datos:**
   ```bash
   # Instalar pscale CLI
   brew install planetscale/tap/pscale
   
   # O descargar de: https://github.com/planetscale/cli
   
   # Login
   pscale auth login
   
   # Conectar y crear shell
   pscale shell umsa-transporte main
   
   # Luego pega el contenido de database_export.sql
   ```

---

### 🌐 Paso 3: Desplegar Backend en Render

1. En Render Dashboard, click **"New +"** → **"Web Service"**

2. Conecta tu repositorio:
   - Selecciona `12Yhorel/umsa-transporte`
   - Click **"Connect"**

3. Configuración:
   ```
   Name: umsa-transporte-backend
   Region: Oregon (free tier disponible)
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: node server.js
   Instance Type: Free
   ```

4. **Variables de Entorno** (Click "Advanced"):
   ```
   NODE_ENV=production
   PUERTO=3001
   HOST=0.0.0.0
   
   # PlanetScale MySQL
   DB_HOST=xxxxx.us-east-3.psdb.cloud
   DB_PORT=3306
   DB_NAME=umsa-transporte
   DB_USER=xxxxxxxxx
   DB_PASSWORD=pscale_pw_xxxxxxxxx
   
   # Configuración SSL para PlanetScale
   DB_SSL=true
   
   DB_POOL_MIN=2
   DB_POOL_MAX=10
   DB_POOL_ACQUIRE=30000
   DB_POOL_IDLE=10000
   
   # JWT - Genera uno nuevo con:
   # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   JWT_SECRET=tu_jwt_secret_aqui
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_EXPIRES_IN=7d
   
   # Email
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=yalvareza@fcpn.edu.bo
   EMAIL_PASSWORD=qrdkbxcexaqlgxvt
   EMAIL_FROM_NAME=Sistema de Transporte UMSA
   EMAIL_FROM_ADDRESS=notificaciones.umsa@umsa.bo
   
   NOTIFICATIONS_ENABLED=true
   ADMIN_NOTIFICATIONS_ENABLED=true
   
   # Render proporciona PORT automáticamente
   ```

5. Click **"Create Web Service"**

6. Espera 3-5 minutos... ¡Listo! 🎉

7. Tu URL será: `https://umsa-transporte-backend.onrender.com`

---

### ✅ Verificar que funciona:

```bash
curl https://umsa-transporte-backend.onrender.com/api/salud
```

---

## 💡 Ventajas de Render:

- ✅ **100% Gratis** (500 horas/mes)
- ✅ **SSL automático** (HTTPS)
- ✅ **Auto-deploy** cuando haces push a GitHub
- ✅ **Logs en tiempo real**
- ✅ **Muy fácil de usar**
- ✅ **Mejor uptime que Railway free tier**

---

## ⚠️ Limitaciones del Free Tier:

- Se "duerme" después de 15 minutos de inactividad
- Primera petición después de dormir tarda ~30 segundos
- 750 horas/mes (suficiente para uso normal)

---

## 🎨 Para el Frontend:

Render también puede hospedar el frontend, pero **Vercel es mejor para Angular**.

---

## 📊 Alternativas Express:

### Opción B: Adaptable.io (También muy fácil)
- Gratis ilimitado
- No se duerme
- [adaptable.io](https://adaptable.io)

### Opción C: Fly.io
- Más técnico pero potente
- 3 VMs gratis
- [fly.io](https://fly.io)

---

## 🔥 Mi Recomendación:

**Backend**: Render + PlanetScale (MySQL)  
**Frontend**: Vercel

Esta combinación es la más confiable y fácil para proyectos gratuitos.
