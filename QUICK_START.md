# 🚀 Guía Express: Deploy en 15 minutos

## Opción más rápida y sencilla

### 📦 Lo que necesitas:
- ✅ Cuenta GitHub (ya la tienes)
- ✅ 15 minutos de tu tiempo

---

## 🎯 PASO A PASO RÁPIDO

### 1️⃣ Base de Datos MySQL Gratis (5 min)

**Ve a [planetscale.com](https://planetscale.com)**

```
1. Sign up con GitHub
2. Click "Create database"
3. Nombre: umsa-transporte
4. Región: US East
5. Click "Create"
```

**Obtener credenciales:**
```
1. Click en tu database
2. Click "Connect"
3. Selecciona "General" (no framework específico)
4. Copia:
   - Host
   - Username  
   - Password
   - Database name
```

**Importar datos:**
```bash
# Opción 1: Con el CLI de PlanetScale
brew install planetscale/tap/pscale
pscale auth login
pscale shell umsa-transporte main

# Luego pega el contenido de database_export.sql línea por línea

# Opción 2: MySQL Workbench
# Conecta usando las credenciales y ejecuta database_export.sql
```

---

### 2️⃣ Deploy Backend en Render (5 min)

**Ve a [render.com](https://render.com)**

```
1. Sign up con GitHub
2. Click "New +" → "Web Service"
3. Conecta tu repo: 12Yhorel/umsa-transporte
4. Configuración:
   - Name: umsa-transporte-backend
   - Region: Oregon (gratis)
   - Branch: main
   - Root Directory: backend
   - Runtime: Node
   - Build Command: npm install
   - Start Command: node server.js
   - Plan: Free
```

**Variables de Entorno (click "Advanced"):**

```plaintext
NODE_ENV=production
PUERTO=3001
HOST=0.0.0.0

# PlanetScale (pega tus credenciales)
DB_HOST=xxxxx.us-east-3.psdb.cloud
DB_PORT=3306
DB_NAME=umsa-transporte
DB_USER=tu_username
DB_PASSWORD=tu_password
DB_SSL=true

DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000

# JWT (usa el que generaste)
JWT_SECRET=df93ac7606dd328ca0ef507a9e86209e0df8d2637d9cdefa36cf61ce3d9f0c948629d76b78acedd5813d752f43148c1e3eaf4a4d03a6190535e0f7327a11504e
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email (usa tus credenciales)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=yalvareza@fcpn.edu.bo
EMAIL_PASSWORD=qrdkbxcexaqlgxvt
EMAIL_FROM_NAME=Sistema de Transporte UMSA
EMAIL_FROM_ADDRESS=notificaciones.umsa@umsa.bo

NOTIFICATIONS_ENABLED=true
ADMIN_NOTIFICATIONS_ENABLED=true
```

```
5. Click "Create Web Service"
6. Espera 3-5 minutos...
```

**Tu backend estará en:**
```
https://umsa-transporte-backend.onrender.com
```

---

### 3️⃣ Deploy Frontend en Vercel (5 min)

**Ve a [vercel.com](https://vercel.com)**

```
1. Sign up con GitHub
2. Click "Add New" → "Project"
3. Import: 12Yhorel/umsa-transporte
4. Configuración:
   - Framework Preset: Angular
   - Root Directory: frontend
   - Build Command: npm run build
   - Output Directory: dist/frontend/browser
```

**Variables de Entorno:**
```plaintext
API_URL=https://umsa-transporte-backend.onrender.com
```

```
5. Click "Deploy"
6. Espera 2-3 minutos...
```

**Tu frontend estará en:**
```
https://umsa-transporte.vercel.app
```

---

### 4️⃣ Configuración Final (2 min)

**Actualizar CORS en Render:**

```
1. Ve a tu servicio backend en Render
2. Environment → Añade:
   FRONTEND_URL=https://umsa-transporte.vercel.app
3. Click "Save Changes"
4. Redeploy automático
```

---

## ✅ VERIFICAR QUE TODO FUNCIONA

### Backend:
```bash
curl https://umsa-transporte-backend.onrender.com/api/salud
```

Debe responder: `{"estado":"saludable",...}`

### Frontend:
```
1. Abre: https://umsa-transporte.vercel.app
2. Deberías ver el login
```

---

## 🎉 ¡LISTO!

Tu aplicación está en producción:
- 🔒 **HTTPS automático**
- 🔄 **Auto-deploy** cuando haces push
- 💰 **100% GRATIS**

---

## 📝 Notas Importantes

### ⚠️ Limitación Free Tier de Render:
- El backend se "duerme" después de 15 min de inactividad
- Primera petición tarda ~30 segundos en "despertar"
- Luego funciona normal

### 💡 Solución:
Usa [cron-job.org](https://cron-job.org) para hacer ping cada 10 minutos:
```
URL: https://umsa-transporte-backend.onrender.com/api/salud
Intervalo: 10 minutos
```

---

## 🆘 Problemas Comunes

### Backend no funciona:
1. Revisa logs en Render → "Logs"
2. Verifica que todas las variables de entorno están bien
3. Verifica que PlanetScale está conectado

### Frontend no carga:
1. Verifica que API_URL apunta al backend correcto
2. Chequea la consola del navegador (F12)
3. Verifica que el build de Angular fue exitoso

### Base de datos no conecta:
1. Verifica que DB_SSL=true
2. Chequea las credenciales de PlanetScale
3. Asegúrate de haber importado los datos

---

## 📞 Soporte

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **PlanetScale Docs**: [planetscale.com/docs](https://planetscale.com/docs)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)

---

¡Disfruta tu app en producción! 🚀
