# 🚀 Guía de Despliegue en Railway

## Sistema de la Unidad de Transporte - UMSA

Esta guía te ayudará a desplegar el backend del sistema en Railway.

---

## 📋 Prerrequisitos

1. Cuenta en [Railway](https://railway.app)
2. Repositorio de GitHub conectado
3. Datos de correo electrónico para notificaciones

---

## 🔧 Paso 1: Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app) e inicia sesión
2. Haz clic en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Autoriza a Railway para acceder a tu GitHub
5. Selecciona el repositorio: `12Yhorel/umsa-transporte`

---

## 🗄️ Paso 2: Añadir Base de Datos MySQL

1. En tu proyecto de Railway, haz clic en **"+ New"**
2. Selecciona **"Database"** → **"Add MySQL"**
3. Railway creará automáticamente una base de datos MySQL
4. Espera a que se aprovisione (tarda ~1 minuto)

---

## 📊 Paso 3: Importar el Esquema de la Base de Datos

Railway te proporcionará las credenciales. Usa una de estas opciones:

### Opción A: Usar Railway CLI (Recomendado)

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Iniciar sesión
railway login

# Vincular proyecto
railway link

# Conectar a MySQL
railway run mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE

# Importar el esquema
railway run mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < database_export.sql
```

### Opción B: Usar MySQL Workbench o similar

1. Obtén las credenciales de Railway:
   - Haz clic en el servicio MySQL
   - Ve a la pestaña **"Variables"**
   - Copia: `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
2. Conéctate con tu cliente MySQL favorito
3. Importa el archivo `database_export.sql`

---

## ⚙️ Paso 4: Configurar Variables de Entorno

1. Haz clic en tu servicio de backend en Railway
2. Ve a la pestaña **"Variables"**
3. Añade las siguientes variables:

### Variables Requeridas:

```plaintext
NODE_ENV=production
PUERTO=3001
HOST=0.0.0.0

# Railway proporciona automáticamente estas variables para MySQL:
# MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_PORT
# Pero las mapeamos a nuestros nombres:

DB_HOST=${{MySQL.MYSQL_HOST}}
DB_PORT=${{MySQL.MYSQL_PORT}}
DB_NAME=${{MySQL.MYSQL_DATABASE}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}

# Pool de conexiones
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000

# JWT - ¡CAMBIA ESTE SECRET!
JWT_SECRET=tu_jwt_secret_super_seguro_cambiar_aqui
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email - Usa tus credenciales de Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-correo@gmail.com
EMAIL_PASSWORD=tu_app_password_de_gmail
EMAIL_FROM_NAME=Sistema de Transporte UMSA
EMAIL_FROM_ADDRESS=notificaciones.umsa@umsa.bo

# Seguridad
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=10485760
DEBUG_MODE=false

# Notificaciones
NOTIFICATIONS_ENABLED=true
ADMIN_NOTIFICATIONS_ENABLED=true
```

### 📝 Notas Importantes:

- **JWT_SECRET**: Genera uno seguro usando: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **EMAIL_PASSWORD**: Usa una "App Password" de Gmail ([cómo generarla](https://support.google.com/accounts/answer/185833))
- Railway conectará automáticamente las variables de MySQL usando `${{MySQL.VARIABLE}}`

---

## 🔗 Paso 5: Configurar el Directorio de la Aplicación

1. En tu servicio de backend, ve a **"Settings"**
2. En **"Build Settings"**, configura:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

---

## 🚀 Paso 6: Desplegar

1. Railway detectará automáticamente los cambios y desplegará
2. Espera a que termine el build (3-5 minutos la primera vez)
3. Una vez completado, Railway te dará una URL pública

---

## 🌐 Paso 7: Obtener la URL del Backend

1. En tu servicio de backend, ve a **"Settings"**
2. En la sección **"Networking"**, haz clic en **"Generate Domain"**
3. Railway te asignará un dominio como: `tu-app.up.railway.app`
4. **Guarda esta URL** - la necesitarás para el frontend

---

## ✅ Paso 8: Verificar el Despliegue

Prueba tu API:

```bash
# Health check
curl https://tu-app.up.railway.app/api/health

# Debería responder con:
# {"status":"success","message":"Sistema de la Unidad de Transporte - UMSA funcionando correctamente"}
```

---

## 🔐 Paso 9: Crear Usuario Administrador Inicial

Usa una herramienta como Postman o curl:

```bash
curl -X POST https://tu-app.up.railway.app/api/auth/registro-publico \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Admin",
    "apellido": "Sistema",
    "email": "admin@umsa.bo",
    "password": "Admin123!",
    "ci": "12345678",
    "telefono": "70000000"
  }'
```

Luego, actualiza el rol en la base de datos a `admin`.

---

## 🎨 Paso 10: Configurar CORS

Una vez que despliegues el frontend en Vercel, necesitarás actualizar:

1. La variable `FRONTEND_URL` con la URL de Vercel
2. Railway redesplegará automáticamente

---

## 📊 Monitoreo

Railway proporciona:
- **Logs en tiempo real**: Pestaña "Logs"
- **Métricas**: CPU, RAM, Network
- **Alertas**: Configura notificaciones

---

## 🆘 Solución de Problemas

### El deploy falla

1. Verifica los logs en Railway
2. Asegúrate de que todas las variables de entorno están configuradas
3. Verifica que el `Root Directory` sea `backend`

### No se puede conectar a la base de datos

1. Verifica que el servicio MySQL esté corriendo
2. Confirma que las variables `DB_*` están mapeadas correctamente
3. Revisa los logs de conexión

### Errores de autenticación

1. Verifica que `JWT_SECRET` esté configurado
2. Asegúrate de que el usuario administrador exista en la BD

---

## 📚 Recursos Adicionales

- [Documentación de Railway](https://docs.railway.app)
- [Railway CLI](https://docs.railway.app/develop/cli)
- [Comunidad de Railway](https://discord.gg/railway)

---

## 🔄 Actualizaciones

Railway desplegará automáticamente cuando hagas push a GitHub:

```bash
git add .
git commit -m "Update backend"
git push origin main
```

---

## 💡 Consejos de Producción

1. **Monitorea los logs** regularmente
2. **Configura backups** de la base de datos
3. **Usa variables de entorno** para configuración sensible
4. **Implementa rate limiting** adecuado
5. **Actualiza dependencias** periódicamente

---

¡Tu backend está listo para producción! 🎉
