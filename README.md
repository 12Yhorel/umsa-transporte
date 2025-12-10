# Sistema de la Unidad de Transporte - UMSA

Sistema completo de gestión para la Unidad de Transporte de la Universidad Mayor de San Andrés.

## 📂 Estructura

```
umsa-transporte/
├── backend/              # API REST (Node.js + Express + MySQL)
├── frontend/             # App Web (Angular 18)
├── database_export.sql   # Base de datos MySQL
└── QUICK_START.md       # Guía de despliegue rápido
```

## 🚀 Despliegue Rápido

Sigue la guía **[QUICK_START.md](QUICK_START.md)** para desplegar en 15 minutos:

- **Backend**: Render (gratis)
- **Base de Datos**: PlanetScale MySQL (gratis)  
- **Frontend**: Vercel (gratis)

## 💻 Desarrollo Local

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Configura .env con tus credenciales
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Base de Datos
```bash
mysql -u root -p < database_export.sql
```

## 🔧 Stack Tecnológico

- **Backend**: Node.js 18, Express, JWT, MySQL2
- **Frontend**: Angular 18, TypeScript, SCSS
- **Base de Datos**: MySQL 8.0

## 📧 Contacto

Email: yalvareza@fcpn.edu.bo

---

**Universidad Mayor de San Andrés** - Unidad de Transporte
