# 🚀 Backend - Sistema de la Unidad de Transporte UMSA

Backend API RESTful para el Sistema de Gestión de la Unidad de Transporte de la Universidad Mayor de San Andrés (UMSA).

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Instalación Local](#instalación-local)
- [Despliegue en Railway](#despliegue-en-railway)
- [Variables de Entorno](#variables-de-entorno)
- [API Endpoints](#api-endpoints)
- [Estructura del Proyecto](#estructura-del-proyecto)

## ✨ Características

- ✅ Autenticación JWT con roles (admin, conductor, mecanico, solicitante)
- ✅ Gestión completa de usuarios
- ✅ Control de flota vehicular
- ✅ Gestión de conductores
- ✅ Sistema de inventario de repuestos
- ✅ Registro de reparaciones y mantenimiento
- ✅ Sistema de reservas de vehículos
- ✅ Generación de códigos QR
- ✅ Notificaciones por email
- ✅ Dashboard con estadísticas
- ✅ Generación de reportes PDF
- ✅ Sistema de recuperación de contraseñas

## 🛠️ Tecnologías

- **Node.js** 14+
- **Express.js** - Framework web
- **MySQL** - Base de datos
- **JWT** - Autenticación
- **Nodemailer** - Envío de emails
- **PDFKit** - Generación de PDFs
- **QR-Image** - Códigos QR
- **Bcrypt** - Hash de contraseñas
- **Helmet** - Seguridad HTTP
- **Morgan** - Logger de requests

## 💻 Instalación Local

### Prerrequisitos

- Node.js 14 o superior
- MySQL 8.0 o superior
- npm o yarn

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/12Yhorel/umsa-transporte.git
cd umsa-transporte/backend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Edita .env con tus credenciales
```

4. **Crear la base de datos**
```bash
mysql -u root -p < ../database_export.sql
```

5. **Iniciar el servidor**
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

El servidor estará corriendo en `http://localhost:3001`

## 🚂 Despliegue en Railway

Sigue la guía completa en [RAILWAY_DEPLOYMENT.md](../RAILWAY_DEPLOYMENT.md)

### Resumen rápido:

1. Crea un nuevo proyecto en [Railway](https://railway.app)
2. Conecta tu repositorio de GitHub
3. Añade un servicio MySQL
4. Configura las variables de entorno
5. Importa el esquema de la base de datos
6. ¡Despliega!

## 🔐 Variables de Entorno

Copia `.env.example` a `.env` y configura:

### Servidor
- `NODE_ENV` - Entorno (development/production)
- `PUERTO` - Puerto del servidor (default: 3001)
- `HOST` - Host del servidor (default: 0.0.0.0)

### Base de Datos
- `DB_HOST` - Host de MySQL
- `DB_PORT` - Puerto de MySQL (default: 3306)
- `DB_NAME` - Nombre de la base de datos
- `DB_USER` - Usuario de MySQL
- `DB_PASSWORD` - Contraseña de MySQL

### Autenticación
- `JWT_SECRET` - Secreto para firmar tokens JWT
- `JWT_EXPIRES_IN` - Tiempo de expiración del token (default: 24h)

### Email
- `EMAIL_HOST` - Host SMTP (ej: smtp.gmail.com)
- `EMAIL_PORT` - Puerto SMTP (default: 587)
- `EMAIL_USER` - Usuario del correo
- `EMAIL_PASSWORD` - Contraseña o App Password
- `EMAIL_FROM_NAME` - Nombre del remitente
- `EMAIL_FROM_ADDRESS` - Email del remitente

### URLs
- `FRONTEND_URL` - URL del frontend para CORS

## 📡 API Endpoints

### Autenticación
```
POST   /api/auth/login                  # Login de usuario
POST   /api/auth/registro-publico       # Registro público (solicitante)
POST   /api/auth/recuperar-password     # Solicitar recuperación
POST   /api/auth/restablecer-password   # Restablecer con token
POST   /api/auth/verificar-token        # Verificar token de recuperación
```

### Usuarios
```
GET    /api/usuarios                    # Listar todos (admin)
GET    /api/usuarios/:id                # Obtener uno
POST   /api/usuarios                    # Crear usuario (admin)
PUT    /api/usuarios/:id                # Actualizar usuario
DELETE /api/usuarios/:id                # Eliminar usuario (admin)
GET    /api/usuarios/perfil/mi-perfil   # Obtener perfil propio
PUT    /api/usuarios/perfil/actualizar  # Actualizar perfil propio
```

### Vehículos
```
GET    /api/vehiculos                   # Listar todos
GET    /api/vehiculos/:id               # Obtener uno
POST   /api/vehiculos                   # Crear vehículo
PUT    /api/vehiculos/:id               # Actualizar vehículo
DELETE /api/vehiculos/:id               # Eliminar vehículo
GET    /api/vehiculos/disponibles       # Listar disponibles
```

### Conductores
```
GET    /api/conductores                 # Listar todos
GET    /api/conductores/:id             # Obtener uno
POST   /api/conductores                 # Crear conductor
PUT    /api/conductores/:id             # Actualizar conductor
DELETE /api/conductores/:id             # Eliminar conductor
GET    /api/conductores/disponibles     # Listar disponibles
```

### Inventario
```
GET    /api/inventario                  # Listar repuestos
GET    /api/inventario/:id              # Obtener repuesto
POST   /api/inventario                  # Crear repuesto
PUT    /api/inventario/:id              # Actualizar repuesto
DELETE /api/inventario/:id              # Eliminar repuesto
GET    /api/inventario/bajo-stock       # Repuestos con bajo stock
```

### Reparaciones
```
GET    /api/reparaciones                # Listar reparaciones
GET    /api/reparaciones/:id            # Obtener una
POST   /api/reparaciones                # Registrar reparación
PUT    /api/reparaciones/:id            # Actualizar reparación
DELETE /api/reparaciones/:id            # Eliminar reparación
GET    /api/reparaciones/vehiculo/:id   # Por vehículo
```

### Reservas
```
GET    /api/reservas                    # Listar reservas
GET    /api/reservas/:id                # Obtener una
POST   /api/reservas                    # Crear reserva
PUT    /api/reservas/:id                # Actualizar reserva
DELETE /api/reservas/:id                # Eliminar reserva
GET    /api/reservas/mis-reservas       # Reservas del usuario
PUT    /api/reservas/:id/aprobar        # Aprobar reserva (admin)
PUT    /api/reservas/:id/rechazar       # Rechazar reserva (admin)
```

### Dashboard
```
GET    /api/dashboard/estadisticas      # Estadísticas generales
GET    /api/dashboard/ultimas-reservas  # Últimas reservas
GET    /api/dashboard/vehiculos-estado  # Estado de vehículos
```

### Sistema
```
GET    /api/salud                       # Health check
GET    /api/info                        # Información del sistema
GET    /api/pool-status                 # Estado del pool de conexiones
```

## 📁 Estructura del Proyecto

```
backend/
├── config/
│   └── database.js              # Configuración de MySQL
├── controllers/
│   ├── authController.js        # Lógica de autenticación
│   ├── usuarioController.js     # Lógica de usuarios
│   ├── vehiculoController.js    # Lógica de vehículos
│   ├── conductorController.js   # Lógica de conductores
│   ├── inventarioController.js  # Lógica de inventario
│   ├── reparacionController.js  # Lógica de reparaciones
│   ├── reservaController.js     # Lógica de reservas
│   └── dashboardController.js   # Lógica de dashboard
├── middleware/
│   ├── auth.js                  # Verificación JWT
│   ├── roles.js                 # Control de roles
│   ├── validation.js            # Validaciones
│   └── request-cancellation.js  # Cancelación de peticiones
├── models/
│   ├── Usuario.js               # Modelo de usuario
│   ├── Vehiculo.js              # Modelo de vehículo
│   ├── Conductor.js             # Modelo de conductor
│   ├── Inventario.js            # Modelo de inventario
│   ├── Reparacion.js            # Modelo de reparación
│   └── Reserva.js               # Modelo de reserva
├── routes/
│   ├── auth.js                  # Rutas de autenticación
│   ├── usuarios.js              # Rutas de usuarios
│   ├── vehiculos.js             # Rutas de vehículos
│   ├── conductores.js           # Rutas de conductores
│   ├── inventario.js            # Rutas de inventario
│   ├── reparaciones.js          # Rutas de reparaciones
│   ├── reservas.js              # Rutas de reservas
│   └── dashboard.js             # Rutas de dashboard
├── utils/
│   ├── emailService.js          # Servicio de email
│   ├── pdfGenerator.js          # Generador de PDFs
│   ├── qrGenerator.js           # Generador de QR
│   └── validators.js            # Validadores
├── public/
│   ├── qr-codes/                # Códigos QR generados
│   └── reports/                 # Reportes generados
├── .env.example                 # Ejemplo de variables
├── package.json                 # Dependencias
├── railway.json                 # Configuración Railway
└── server.js                    # Punto de entrada
```

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt
- Autenticación basada en JWT
- Protección contra CORS
- Rate limiting
- Validación de datos de entrada
- Helmet para headers de seguridad
- Variables de entorno para datos sensibles

## 📊 Monitoreo

El backend incluye endpoints de monitoreo:

- `/api/salud` - Health check básico
- `/api/info` - Información del sistema
- `/api/pool-status` - Estado del pool de conexiones MySQL

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests en modo watch
npm run test:watch
```

## 📝 Logs

Los logs se generan automáticamente:
- Desarrollo: formato `dev` en consola
- Producción: formato `combined`, solo errores

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver el archivo LICENSE para más detalles

## 👥 Equipo

Desarrollado por el equipo de la Unidad de Transporte - UMSA

## 📞 Soporte

Para preguntas o problemas:
- Email: yalvareza@fcpn.edu.bo
- GitHub Issues: [Crear Issue](https://github.com/12Yhorel/umsa-transporte/issues)

---

⭐ Si este proyecto te fue útil, no olvides darle una estrella en GitHub!
