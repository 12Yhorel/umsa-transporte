# Frontend - UMSA Transporte

Frontend Angular para el Sistema de la Unidad de Transporte - UMSA.

## 🚀 Requisitos

- Node.js 18+
- npm 9+
- Angular 18+

## 📦 Instalación

```bash
npm install
```

## 🎯 Desarrollo

```bash
npm start
```

Navega a `http://localhost:4200/`.

## 🏗️ Build

```bash
npm run build
```

## 📋 Estructura del Proyecto

```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   ├── interceptors/
│   │   └── guards/
│   ├── shared/
│   │   ├── components/
│   │   ├── directives/
│   │   └── pipes/
│   ├── modules/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── usuarios/
│   │   ├── vehiculos/
│   │   ├── conductores/
│   │   ├── reservas/
│   │   ├── inventario/
│   │   └── reparaciones/
│   └── app.routes.ts
├── environments/
└── assets/
```

## 🔐 Autenticación

- JWT Token basado en autenticación
- Token almacenado en localStorage
- Interceptor automático de Bearer Token

## 📡 API

API Backend: `http://localhost:3001`

### Endpoints Principales

- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/registrar` - Registrar usuario
- `GET /api/usuarios` - Obtener usuarios
- `GET /api/vehiculos` - Obtener vehículos
- `GET /api/conductores` - Obtener conductores
- `GET /api/reservas` - Obtener reservas
- `GET /api/inventario` - Obtener inventario
- `GET /api/reparaciones` - Obtener reparaciones

## 📝 Licencia

UMSA 2025
