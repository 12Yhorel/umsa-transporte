# Arquitectura del Sistema - UMSA Transporte

## Descripción General

Sistema web full-stack para la gestión integral de la Unidad de Transporte de la UMSA, construido con arquitectura cliente-servidor moderna.

---

## Stack Tecnológico

### Backend
- **Node.js** v18+ con Express.js
- **MySQL 8** como base de datos
- **JWT** para autenticación
- **mysql2/promise** para conexiones con pool

### Frontend
- **Angular 18** con standalone components
- **TypeScript 5.4**
- **RxJS** para programación reactiva
- **SCSS** para estilos

---

## Arquitectura Backend

### Estructura de Carpetas
```
backend/
├── config/          # Configuración (BD, variables)
├── controllers/     # Lógica de negocio
├── models/          # Modelos de datos
├── routes/          # Definición de endpoints
├── middleware/      # Interceptores (auth, validación)
├── utils/           # Utilidades (PDF, QR, reportes)
└── server.js        # Punto de entrada
```

### Flujo de Funcionamiento Backend

#### 1. Inicialización del Servidor
```javascript
// server.js
class ServidorUMSA {
  constructor() {
    this.puerto = 3001
    this.host = '0.0.0.0'  // Escucha en todas las interfaces
    this.conectarBaseDatos()
    this.inicializarMiddlewares()
    this.inicializarRutas()
  }
}
```

**Proceso:**
1. Carga variables de entorno desde `.env`
2. Conecta al pool de MySQL con 20 conexiones
3. Configura middlewares globales (CORS, Helmet, Compression)
4. Registra todas las rutas de los módulos
5. Inicia servidor en puerto 3001

#### 2. Sistema de Conexión a Base de Datos

```javascript
// config/database.js
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '***',
  database: 'gestion_transporte_umsa',
  connectionLimit: 20,      // Pool de 20 conexiones
  idleTimeout: 30000,       // Cierra inactivas en 30s
  connectTimeout: 10000     // Timeout de conexión 10s
})
```

**Características:**
- **Pool de conexiones**: Reutiliza conexiones activas
- **Timeouts**: Previene bloqueos (5s conexión, 10s query)
- **Limpieza automática**: Cada 5 minutos libera conexiones
- **Manejo de errores**: Logs detallados de consultas lentas

#### 3. Sistema de Autenticación

**JWT (JSON Web Tokens)**
```javascript
// middleware/auth.js
const autenticarToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]
  
  if (!token) return res.status(401).json({ error: 'No autorizado' })
  
  jwt.verify(token, SECRET, (err, usuario) => {
    if (err) return res.status(403).json({ error: 'Token inválido' })
    req.usuario = usuario
    next()
  })
}
```

**Flujo de autenticación:**
1. Usuario envía credenciales a `/api/auth/login`
2. Backend valida contra BD
3. Si es válido, genera JWT con datos del usuario
4. Frontend guarda token en localStorage
5. Cada petición incluye token en header `Authorization: Bearer <token>`
6. Middleware verifica token antes de procesar petición

#### 4. Estructura de Rutas

**Patrón RESTful:**
```javascript
// routes/vehiculos.js
router.get('/', autenticarToken, VehiculoController.obtenerTodos)
router.get('/:id', autenticarToken, VehiculoController.obtenerPorId)
router.post('/', autenticarToken, validarVehiculo, VehiculoController.crear)
router.put('/:id', autenticarToken, validarVehiculo, VehiculoController.actualizar)
router.delete('/:id', autenticarToken, VehiculoController.eliminar)
```

**Endpoints principales:**
- `/api/auth/*` - Autenticación (login, registro)
- `/api/usuarios/*` - Gestión de usuarios
- `/api/vehiculos/*` - CRUD de vehículos
- `/api/conductores/*` - CRUD de conductores
- `/api/reservas/*` - Sistema de reservas
- `/api/reparaciones/*` - Registro de reparaciones
- `/api/inventario/*` - Control de inventario
- `/api/dashboard/estadisticas` - Estadísticas agregadas

#### 5. Controladores y Lógica de Negocio

```javascript
// controllers/vehiculoController.js
class VehiculoController {
  static async obtenerTodos(req, res) {
    const { pagina = 1, limite = 10, estado, marca } = req.query
    
    // Construir filtros dinámicos
    const filtros = {}
    if (estado) filtros.estado = estado
    if (marca) filtros.marca = marca
    
    // Llamar al modelo
    const resultado = await ModeloVehiculo.obtenerTodosVehiculos(
      pagina, 
      limite, 
      filtros
    )
    
    res.json({ success: true, data: resultado })
  }
}
```

**Responsabilidades:**
- Validar parámetros de entrada
- Llamar a modelos para acceso a datos
- Transformar respuestas
- Manejar errores con try/catch

#### 6. Modelos de Datos

```javascript
// models/Vehiculo.js
class ModeloVehiculo {
  static async obtenerTodosVehiculos(pagina, limite, filtros) {
    const offset = (pagina - 1) * limite
    
    let sql = 'SELECT * FROM vehiculos WHERE 1=1'
    const params = []
    
    if (filtros.estado) {
      sql += ' AND estado = ?'
      params.push(filtros.estado)
    }
    
    sql += ' LIMIT ? OFFSET ?'
    params.push(parseInt(limite), offset)
    
    const [rows] = await ejecutarConsulta(sql, params)
    return rows
  }
}
```

**Características:**
- Construyen queries SQL dinámicas
- Usan consultas parametrizadas (previene SQL injection)
- Implementan paginación
- Manejan relaciones entre tablas

#### 7. Sistema de Dashboard con Agregaciones

```javascript
// controllers/dashboardController.js
static async obtenerEstadisticas(req, res) {
  // Query optimizada con agregaciones SQL
  const [vehiculos] = await ejecutarConsulta(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN estado = 'DISPONIBLE' THEN 1 ELSE 0 END) as disponibles,
      SUM(CASE WHEN estado = 'EN_USO' THEN 1 ELSE 0 END) as enUso,
      SUM(CASE WHEN estado = 'EN_REPARACION' THEN 1 ELSE 0 END) as mantenimiento
    FROM vehiculos
  `)
  
  // Retorna todas las estadísticas en una sola respuesta
  res.json({
    success: true,
    data: { vehiculos, reservas, reparaciones, inventario, conductores }
  })
}
```

**Ventajas:**
- Una sola petición HTTP en lugar de 5
- Cálculos en BD (más rápido que en aplicación)
- Reduce carga de red y procesamiento

---

## Arquitectura Frontend

### Estructura de Carpetas
```
frontend/src/
├── app/
│   ├── core/              # Servicios centrales
│   │   ├── services/      # Auth, HTTP
│   │   ├── interceptors/  # HTTP interceptors
│   │   └── guards/        # Route guards
│   ├── modules/           # Módulos funcionales
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── vehiculos/
│   │   ├── conductores/
│   │   ├── reservas/
│   │   ├── reparaciones/
│   │   └── inventario/
│   ├── shared/            # Componentes compartidos
│   ├── app.routes.ts      # Rutas
│   └── app.config.ts      # Configuración
├── environments/          # Variables de entorno
└── styles.scss            # Estilos globales
```

### Flujo de Funcionamiento Frontend

#### 1. Inicialización de Angular

```typescript
// main.ts
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations()
  ]
})
```

**Proceso:**
1. Angular carga componente raíz `AppComponent`
2. Inicializa router con configuración de rutas
3. Configura HttpClient con interceptor de autenticación
4. Inyecta servicios globales

#### 2. Sistema de Rutas y Navegación

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'auth', component: AuthComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [authGuard]  // Protegida
  },
  { 
    path: 'vehiculos', 
    component: VehiculosComponent,
    canActivate: [authGuard]
  },
  // ... más rutas
]
```

**Características:**
- **Lazy loading**: Módulos se cargan bajo demanda
- **Guards**: Verifican autenticación antes de cargar
- **Redirects**: Redirige a login si no autenticado

#### 3. Servicio de Autenticación

```typescript
// core/services/auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null)
  public currentUser$ = this.currentUserSubject.asObservable()

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/auth/login`, {
      email, password
    }).pipe(
      map(response => {
        if (response.token) {
          localStorage.setItem('token', response.token)
          localStorage.setItem('user', JSON.stringify(response.usuario))
          this.currentUserSubject.next(response.usuario)
        }
        return response
      })
    )
  }

  logout(): void {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    this.currentUserSubject.next(null)
  }

  get isAuthenticated(): boolean {
    return !!localStorage.getItem('token')
  }
}
```

**Funcionalidades:**
- Gestiona token JWT
- Observable de usuario actual (reactivo)
- Persistencia en localStorage
- Métodos de login/logout

#### 4. HTTP Interceptor para JWT

```typescript
// core/interceptors/auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token')
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
  }
  
  return next(req).pipe(
    catchError(error => {
      if (error.status === 401) {
        // Token expirado, redirigir a login
        localStorage.clear()
        window.location.href = '/auth'
      }
      return throwError(() => error)
    })
  )
}
```

**Funciones:**
- Añade token automáticamente a todas las peticiones
- Maneja errores 401 (no autorizado)
- Limpia sesión si token expira

#### 5. Guards de Navegación

```typescript
// core/guards/auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService)
  const router = inject(Router)

  if (authService.isAuthenticated) {
    return true
  }

  router.navigate(['/auth'])
  return false
}
```

**Propósito:**
- Protege rutas que requieren autenticación
- Redirige a login si no hay sesión válida

#### 6. Componentes y Servicios de Módulos

**Ejemplo: Módulo de Vehículos**

```typescript
// modules/vehiculos/vehiculos.service.ts
@Injectable({ providedIn: 'root' })
export class VehiculosService {
  private apiUrl = `${environment.apiUrl}/api/vehiculos`

  getVehiculos(params: any): Observable<any> {
    return this.http.get(this.apiUrl, { params })
  }

  getVehiculo(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`)
  }

  createVehiculo(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data)
  }

  updateVehiculo(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data)
  }

  deleteVehiculo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`)
  }
}
```

```typescript
// modules/vehiculos/vehiculos.component.ts
@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehiculos.component.html',
  styleUrls: ['./vehiculos.component.scss']
})
export class VehiculosComponent implements OnInit {
  vehiculos: any[] = []
  cargando = false

  constructor(private vehiculosService: VehiculosService) {}

  ngOnInit() {
    this.cargarVehiculos()
  }

  cargarVehiculos() {
    this.cargando = true
    this.vehiculosService.getVehiculos({ pagina: 1, limite: 20 })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.vehiculos = response.data.vehiculos || []
          }
          this.cargando = false
        },
        error: (error) => {
          console.error('Error:', error)
          this.cargando = false
        }
      })
  }
}
```

**Patrón:**
1. **Servicio** maneja comunicación HTTP
2. **Componente** usa servicio para obtener datos
3. **Template** muestra datos con directivas Angular
4. **Observables** para programación reactiva

#### 7. Dashboard con Estadísticas

```typescript
// modules/dashboard/dashboard.component.ts
export class DashboardComponent implements OnInit {
  stats = {
    vehiculos: { total: 0, disponibles: 0, enUso: 0, mantenimiento: 0 },
    reservas: { total: 0, pendientes: 0, activas: 0, completadas: 0 },
    reparaciones: { total: 0, enProceso: 0, completadas: 0 },
    inventario: { total: 0, bajoStock: 0 },
    conductores: { total: 0, activos: 0 }
  }

  ngOnInit() {
    this.cargarEstadisticas()
  }

  cargarEstadisticas() {
    this.http.get(`${environment.apiUrl}/api/dashboard/estadisticas`)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.stats = response.data
          }
        }
      })
  }
}
```

**Template con datos:**
```html
<div class="stats-grid">
  <div class="stat-card">
    <h3>Vehículos</h3>
    <p class="total">{{ stats.vehiculos.total }}</p>
    <div class="details">
      <span class="disponible">{{ stats.vehiculos.disponibles }} disponibles</span>
      <span class="en-uso">{{ stats.vehiculos.enUso }} en uso</span>
    </div>
  </div>
  <!-- más tarjetas... -->
</div>
```

#### 8. Sistema de Estilos Unificados

```scss
// styles.scss (global)
:root {
  --primary-color: #1a5490;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --warning-color: #ffc107;
}

.module-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  transition: all 0.3s;
  
  &:hover {
    background: darken($primary-color, 10%);
  }
}

.table-container {
  overflow-x: auto;
  
  table {
    width: 100%;
    border-collapse: collapse;
    
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
  }
}
```

**Características:**
- Variables CSS para colores consistentes
- Clases reutilizables
- Responsive design con media queries
- Animaciones y transiciones

---

## Comunicación Frontend-Backend

### Flujo Completo de una Petición

#### Ejemplo: Listar Vehículos

**1. Usuario accede a página de vehículos**
```
URL: http://localhost:4200/vehiculos
```

**2. Angular Router carga componente**
```typescript
// Verifica authGuard → Usuario autenticado ✓
// Carga VehiculosComponent
```

**3. Componente solicita datos**
```typescript
this.vehiculosService.getVehiculos({ pagina: 1, limite: 20 })
```

**4. HTTP Interceptor añade token**
```typescript
// Interceptor añade header automáticamente
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**5. Petición HTTP enviada**
```
GET http://localhost:3001/api/vehiculos?pagina=1&limite=20
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json
```

**6. Backend recibe petición**
```javascript
// Express router
router.get('/', autenticarToken, VehiculoController.obtenerTodos)

// Middleware verifica token ✓
// Controller procesa petición
```

**7. Modelo consulta base de datos**
```javascript
const [rows] = await ejecutarConsulta(
  'SELECT * FROM vehiculos LIMIT ? OFFSET ?',
  [20, 0]
)
```

**8. Backend responde**
```json
{
  "success": true,
  "data": {
    "vehiculos": [
      { "id": 1, "placa": "ABC-123", "marca": "Toyota", ... },
      { "id": 2, "placa": "DEF-456", "marca": "Nissan", ... }
    ],
    "total": 45,
    "pagina": 1,
    "totalPaginas": 3
  }
}
```

**9. Frontend procesa respuesta**
```typescript
.subscribe({
  next: (response) => {
    this.vehiculos = response.data.vehiculos
    this.cargando = false
  }
})
```

**10. Angular actualiza vista**
```html
<tr *ngFor="let vehiculo of vehiculos">
  <td>{{ vehiculo.placa }}</td>
  <td>{{ vehiculo.marca }}</td>
  <td>{{ vehiculo.modelo }}</td>
</tr>
```

---

## Seguridad Implementada

### Backend
1. **Helmet.js**: Protección de headers HTTP
2. **CORS**: Solo permite origen del frontend
3. **Rate Limiting**: Previene ataques de fuerza bruta
4. **JWT**: Tokens firmados y con expiración
5. **Consultas parametrizadas**: Previene SQL injection
6. **Validación de entrada**: Middleware de validación
7. **Hash de contraseñas**: bcrypt con salt

### Frontend
1. **Auth Guard**: Protege rutas privadas
2. **HTTP Interceptor**: Maneja tokens automáticamente
3. **Validación de formularios**: Reactive Forms
4. **Sanitización**: Angular DomSanitizer
5. **HTTPS**: En producción

---

## Optimizaciones Aplicadas

### Backend
- **Pool de conexiones**: Reutiliza conexiones BD
- **Limpieza automática**: Libera recursos cada 5 min
- **Queries optimizadas**: Agregaciones SQL en lugar de loops
- **Compresión**: Gzip para respuestas
- **Paginación**: Evita cargar todos los datos
- **Índices en BD**: Búsquedas más rápidas

### Frontend
- **Lazy Loading**: Módulos cargados bajo demanda
- **OnPush Strategy**: Detección de cambios optimizada
- **Standalone Components**: Menos dependencias
- **RxJS Operators**: Optimización de streams
- **SCSS Variables**: Reutilización de estilos
- **Build Production**: Minificación y tree-shaking

---

## Variables de Entorno

### Backend (.env)
```env
NODE_ENV=development
PUERTO=3001
HOST=0.0.0.0

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=***
DB_NAME=gestion_transporte_umsa

JWT_SECRET=clave_super_secreta
JWT_EXPIRATION=24h

FRONTEND_URL=http://localhost:4200
```

### Frontend (environment.ts)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3001'
}
```

---

## Comandos de Ejecución

### Desarrollo
```bash
# Backend
cd backend
node server.js

# Frontend
cd frontend
npx ng serve --host 0.0.0.0 --port 4200
```

### Acceso
- **Frontend**: http://localhost:4200
- **Backend**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/docs

---

## Manejo de Errores

### Backend
```javascript
try {
  const resultado = await ModeloVehiculo.crear(data)
  res.json({ success: true, data: resultado })
} catch (error) {
  console.error('Error:', error)
  res.status(500).json({ 
    success: false, 
    message: 'Error al crear vehículo',
    error: error.message 
  })
}
```

### Frontend
```typescript
this.service.create(data).subscribe({
  next: (response) => {
    if (response.success) {
      this.showSuccess('Creado exitosamente')
    }
  },
  error: (error) => {
    this.showError(error.error?.message || 'Error al crear')
  }
})
```

---

## Ciclo de Vida de una Sesión

1. **Login**: Usuario ingresa credenciales
2. **Backend valida**: Consulta BD, verifica password
3. **Genera JWT**: Token con datos del usuario
4. **Frontend guarda**: localStorage + BehaviorSubject
5. **Navegación**: Guard verifica autenticación
6. **Peticiones**: Interceptor añade token automáticamente
7. **Middleware verifica**: Backend valida token en cada request
8. **Logout**: Limpia localStorage y redirige

---

## Conclusión

El sistema implementa una arquitectura moderna y escalable:

- **Backend**: API REST robusta con Node.js y Express
- **Frontend**: SPA reactiva con Angular 18
- **Comunicación**: HTTP + JWT para seguridad
- **Base de datos**: MySQL con pool optimizado
- **Seguridad**: Múltiples capas de protección
- **Performance**: Optimizaciones en ambos extremos

La separación de responsabilidades permite desarrollo independiente y facilita el mantenimiento a largo plazo.
