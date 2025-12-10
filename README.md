# Sistema de Gestión de Transporte - UMSA

Sistema completo de gestión de transporte para la Universidad Mayor de San Andrés (UMSA).

## 🚀 Tecnologías

- **Backend**: Node.js + Express + MySQL
- **Frontend**: Angular 18 (Standalone Components)
- **Autenticación**: JWT
- **Email**: Nodemailer

## 📦 Estructura

```
├── backend/          # API REST Node.js
├── frontend/         # Aplicación Angular
└── database_export.sql  # Base de datos
```

## 🔧 Instalación Local

### Backend
```bash
cd backend
npm install
# Configurar .env con tus credenciales
npm start
```

### Frontend
```bash
cd frontend
npm install
ng serve
```

## 🌐 Deploy

Ver [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) para instrucciones completas de deploy en:
- Railway (Backend + MySQL)
- Vercel (Frontend)

## 📝 Características

- ✅ Gestión de vehículos
- ✅ Gestión de conductores
- ✅ Sistema de reservas
- ✅ Control de inventario
- ✅ Registro de reparaciones
- ✅ Gestión de usuarios y roles
- ✅ Dashboard con estadísticas
- ✅ Recuperación de contraseña por email
- ✅ Códigos QR para vehículos
- ✅ Generación de reportes PDF

## 👥 Roles

- **Administrador**: Acceso completo
- **Secretaria**: Gestión de reservas y documentos
- **Encargado**: Gestión operativa
- **Solicitante**: Crear solicitudes de transporte

## 📧 Contacto

Sistema desarrollado para la Unidad de Transporte - UMSA
