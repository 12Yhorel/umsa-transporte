# ==================================================
# GUÍA DE DEPLOYMENT - SISTEMA UMSA TRANSPORTE
# ==================================================

## 📋 OPCIÓN 1: RAILWAY (Recomendado - Todo en uno)

Railway ofrece hosting gratuito para backend + base de datos MySQL

### Paso 1: Crear cuenta en Railway
1. Ve a https://railway.app
2. Regístrate con GitHub
3. Créditos: $5 gratis/mes (suficiente para desarrollo)

### Paso 2: Crear proyecto MySQL
1. En Railway: "New Project" → "Provision MySQL"
2. Copia las credenciales que te da (aparecerán en Variables)
3. Guarda: MYSQLHOST, MYSQLPORT, MYSQLDATABASE, MYSQLUSER, MYSQLPASSWORD

### Paso 3: Importar base de datos
```bash
# Exportar tu base de datos local
mysqldump -u root -p'PDpacho2018.' gestion_transporte_umsa > database_export.sql

# Importar a Railway (usa las credenciales de Railway)
mysql -h MYSQLHOST -P MYSQLPORT -u MYSQLUSER -p'MYSQLPASSWORD' MYSQLDATABASE < database_export.sql
```

### Paso 4: Deploy del Backend
1. En Railway: "New" → "GitHub Repo" → Conecta este repositorio
2. Railway detectará automáticamente Node.js
3. Agrega estas variables de entorno en Railway:

```
NODE_ENV=production
PUERTO=3001
HOST=0.0.0.0

DB_HOST=[tu-mysqlhost-de-railway]
DB_PORT=[tu-mysqlport-de-railway]
DB_NAME=[tu-mysqldatabase-de-railway]
DB_USER=[tu-mysqluser-de-railway]
DB_PASSWORD=[tu-mysqlpassword-de-railway]

JWT_SECRET=umsa_transporte_secret_key_2024_jwt_secure_token_auth
JWT_EXPIRES_IN=24h

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=yalvareza@fcpn.edu.bo
EMAIL_PASSWORD=qrdkbxcexaqlgxvt

FRONTEND_URL=https://tu-dominio-vercel.vercel.app
APP_URL=https://tu-dominio-railway.up.railway.app
```

4. Railway generará una URL tipo: `https://tu-proyecto.up.railway.app`

---

## 📋 OPCIÓN 2: RENDER + PLANETSCALE

### Backend en Render (Gratis)
1. Ve a https://render.com
2. "New" → "Web Service" → Conecta GitHub
3. Configuración:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Variables de entorno (igual que Railway)

### Base de datos en PlanetScale (Gratis)
1. Ve a https://planetscale.com
2. Crea base de datos MySQL
3. Copia connection string
4. Actualiza variables DB_* en Render

---

## 🎨 FRONTEND EN VERCEL (Gratis)

### Paso 1: Preparar frontend
El frontend ya está configurado, solo necesitas actualizar la URL del backend

### Paso 2: Deploy a Vercel
1. Ve a https://vercel.com
2. "Add New" → "Project" → Conecta GitHub
3. Framework Preset: Angular
4. Root Directory: `frontend`
5. Build Command: `npm run build`
6. Output Directory: `dist/frontend/browser`
7. Variables de entorno:
```
API_URL=https://tu-backend-railway.up.railway.app
```

### Paso 3: Configurar rewrites
Vercel detectará automáticamente Angular

---

## 🚀 ALTERNATIVA RÁPIDA: RENDER (Todo en uno)

1. Backend: https://render.com (Free tier)
2. Base de datos: PostgreSQL gratuito incluido
3. Frontend: Mismo Render como Static Site

---

## ✅ VERIFICACIÓN POST-DEPLOY

1. **Backend**: Abre `https://tu-backend.up.railway.app/api/auth/verificar`
   - Debe responder con error 401 (normal, no hay token)
   
2. **Base de datos**: Verifica que las tablas existen
   
3. **Frontend**: Abre `https://tu-frontend.vercel.app`
   - Prueba login/registro
   - Verifica que se conecta al backend

---

## 🔧 CONFIGURACIÓN ADICIONAL

### Actualizar CORS en backend
Ya está configurado para aceptar tu frontend de Vercel

### Actualizar email en producción
Las credenciales de Gmail ya están configuradas

---

## 💰 COSTOS

- **Railway**: $5/mes gratis (suficiente para ~500 horas)
- **Vercel**: Gratis ilimitado para proyectos personales
- **Render**: 750 horas/mes gratis
- **PlanetScale**: 5GB gratis

---

## 📝 SIGUIENTE PASO

¿Quieres que te ayude a:
1. Crear los archivos necesarios para Railway?
2. Configurar Git para hacer push al repositorio?
3. Exportar la base de datos para subirla?
