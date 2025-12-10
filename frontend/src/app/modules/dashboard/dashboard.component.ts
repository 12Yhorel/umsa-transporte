import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@app/core/services/auth.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

interface DashboardStats {
  vehiculos: { total: number; disponibles: number; enUso: number; mantenimiento: number };
  reservas: { total: number; pendientes: number; activas: number; completadas: number };
  reparaciones: { total: number; enProceso: number; completadas: number };
  inventario: { total: number; bajoStock: number };
  conductores: { total: number; activos: number };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <nav class="navbar">
        <div class="navbar-brand">
          <span class="brand-icon">🚌</span>
          <span class="brand-text">UMSA Transporte</span>
        </div>
        <div class="navbar-menu">
          <button class="nav-link" (click)="navegarA('/usuarios')">👥 Usuarios</button>
          <button class="nav-link" (click)="navegarA('/vehiculos')">🚗 Vehículos</button>
          <button class="nav-link" (click)="navegarA('/conductores')">👨‍💼 Conductores</button>
          <button class="nav-link" (click)="navegarA('/reservas')">📅 Reservas</button>
          <button class="nav-link" (click)="navegarA('/inventario')">📦 Inventario</button>
          <button class="nav-link" (click)="navegarA('/reparaciones')">🔧 Reparaciones</button>
          <button class="btn-logout" (click)="onLogout()">Cerrar Sesión</button>
        </div>
      </nav>
      
      <div class="module-container">
        <div class="header">
          <h2>Panel de Control</h2>
          <div class="user-badge" *ngIf="usuario$ | async as usuario">
            <span class="user-icon">👤</span>
            <div class="user-details">
              <strong>{{ usuario.nombres }} {{ usuario.apellidos }}</strong>
              <span class="user-role">{{ usuario.rol }}</span>
            </div>
          </div>
        </div>

        <div class="loading-overlay" *ngIf="cargando">
          <div class="spinner"></div>
          <p>Cargando estadísticas...</p>
        </div>

        <div class="error-message" *ngIf="errorMensaje">
          {{ errorMensaje }}
        </div>

        <!-- Estadísticas Principales -->
        <div class="stats-grid" *ngIf="stats && !cargando">
          <!-- Vehículos -->
          <div class="stat-card stat-vehiculos">
            <div class="stat-icon">🚗</div>
            <div class="stat-content">
              <h3>Vehículos</h3>
              <div class="stat-number">{{ stats.vehiculos.total }}</div>
              <div class="stat-details">
                <span class="badge badge-success">{{ stats.vehiculos.disponibles }} Disponibles</span>
                <span class="badge badge-warning">{{ stats.vehiculos.enUso }} En Uso</span>
                <span class="badge badge-danger">{{ stats.vehiculos.mantenimiento }} Mantenimiento</span>
              </div>
            </div>
          </div>

          <!-- Reservas -->
          <div class="stat-card stat-reservas">
            <div class="stat-icon">📅</div>
            <div class="stat-content">
              <h3>Reservas</h3>
              <div class="stat-number">{{ stats.reservas.total }}</div>
              <div class="stat-details">
                <span class="badge badge-warning">{{ stats.reservas.pendientes }} Pendientes</span>
                <span class="badge badge-info">{{ stats.reservas.activas }} Activas</span>
                <span class="badge badge-success">{{ stats.reservas.completadas }} Completadas</span>
              </div>
            </div>
          </div>

          <!-- Reparaciones -->
          <div class="stat-card stat-reparaciones">
            <div class="stat-icon">🔧</div>
            <div class="stat-content">
              <h3>Reparaciones</h3>
              <div class="stat-number">{{ stats.reparaciones.total }}</div>
              <div class="stat-details">
                <span class="badge badge-warning">{{ stats.reparaciones.enProceso }} En Proceso</span>
                <span class="badge badge-success">{{ stats.reparaciones.completadas }} Completadas</span>
              </div>
            </div>
          </div>

          <!-- Inventario -->
          <div class="stat-card stat-inventario">
            <div class="stat-icon">📦</div>
            <div class="stat-content">
              <h3>Inventario</h3>
              <div class="stat-number">{{ stats.inventario.total }}</div>
              <div class="stat-details">
                <span class="badge badge-danger" *ngIf="stats.inventario.bajoStock > 0">
                  {{ stats.inventario.bajoStock }} Bajo Stock
                </span>
                <span class="badge badge-success" *ngIf="stats.inventario.bajoStock === 0">
                  Stock Normal
                </span>
              </div>
            </div>
          </div>

          <!-- Conductores -->
          <div class="stat-card stat-conductores">
            <div class="stat-icon">👨‍💼</div>
            <div class="stat-content">
              <h3>Conductores</h3>
              <div class="stat-number">{{ stats.conductores.total }}</div>
              <div class="stat-details">
                <span class="badge badge-success">{{ stats.conductores.activos }} Activos</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Módulos de Acceso Rápido -->
        <div class="modules-section">
          <h3>Accesos Rápidos</h3>
          <div class="modules-grid">
            <button class="module-card" (click)="navegarA('/usuarios')">
              <div class="module-icon">👥</div>
              <h4>Usuarios</h4>
              <p>Gestión de usuarios del sistema</p>
            </button>

            <button class="module-card" (click)="navegarA('/vehiculos')">
              <div class="module-icon">🚗</div>
              <h4>Vehículos</h4>
              <p>Administración de la flota vehicular</p>
            </button>

            <button class="module-card" (click)="navegarA('/conductores')">
              <div class="module-icon">👨‍💼</div>
              <h4>Conductores</h4>
              <p>Gestión de conductores</p>
            </button>

            <button class="module-card" (click)="navegarA('/reservas')">
              <div class="module-icon">📅</div>
              <h4>Reservas</h4>
              <p>Control de reservas de vehículos</p>
            </button>

            <button class="module-card" (click)="navegarA('/inventario')">
              <div class="module-icon">📦</div>
              <h4>Inventario</h4>
              <p>Control de repuestos e insumos</p>
            </button>

            <button class="module-card" (click)="navegarA('/reparaciones')">
              <div class="module-icon">🔧</div>
              <h4>Reparaciones</h4>
              <p>Seguimiento de reparaciones</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: var(--light-gray);
    }
    
    .navbar {
      background: linear-gradient(135deg, #1a5490 0%, #144173 100%);
      color: white;
      padding: 15px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: var(--shadow);
    }
    
    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 24px;
      font-weight: 700;
    }

    .brand-icon {
      font-size: 32px;
    }
    
    .navbar-menu {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }
    
    .nav-link {
      color: white;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s;
      text-decoration: none;
      white-space: nowrap;
    }
    
    .nav-link:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    .btn-logout {
      background: rgba(220, 53, 69, 0.9);
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s;
    }

    .btn-logout:hover {
      background: rgba(220, 53, 69, 1);
      transform: translateY(-2px);
    }

    .user-badge {
      display: flex;
      align-items: center;
      gap: 12px;
      background: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: var(--shadow);
    }

    .user-icon {
      font-size: 32px;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .user-details strong {
      color: var(--text-color);
      font-size: 16px;
    }

    .user-role {
      color: var(--dark-gray);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: var(--shadow);
      display: flex;
      align-items: center;
      gap: 20px;
      transition: all 0.3s;
      border-left: 4px solid;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: var(--shadow-hover);
    }

    .stat-vehiculos { border-color: var(--primary-color); }
    .stat-reservas { border-color: var(--info-color); }
    .stat-reparaciones { border-color: var(--warning-color); }
    .stat-inventario { border-color: var(--success-color); }
    .stat-conductores { border-color: var(--secondary-color); }

    .stat-icon {
      font-size: 48px;
      line-height: 1;
    }

    .stat-content {
      flex: 1;
    }

    .stat-content h3 {
      margin: 0 0 8px 0;
      color: var(--dark-gray);
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-number {
      font-size: 36px;
      font-weight: 700;
      color: var(--text-color);
      margin-bottom: 10px;
      line-height: 1;
    }

    .stat-details {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .stat-details .badge {
      font-size: 11px;
      padding: 3px 8px;
    }

    .modules-section {
      margin-top: 40px;
    }

    .modules-section h3 {
      color: var(--text-color);
      margin-bottom: 20px;
      font-size: 1.5rem;
    }

    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
    }

    .module-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: var(--shadow);
      transition: all 0.3s;
      cursor: pointer;
      border: 2px solid transparent;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .module-card:hover {
      transform: translateY(-8px);
      box-shadow: var(--shadow-hover);
      border-color: var(--primary-color);
    }

    .module-icon {
      font-size: 56px;
      line-height: 1;
    }

    .module-card h4 {
      margin: 0;
      color: var(--primary-color);
      font-size: 1.2rem;
    }

    .module-card p {
      margin: 0;
      color: var(--dark-gray);
      font-size: 14px;
    }

    @media (max-width: 768px) {
      .navbar {
        flex-direction: column;
        gap: 15px;
        padding: 15px;
      }

      .navbar-brand {
        font-size: 20px;
      }

      .brand-icon {
        font-size: 28px;
      }

      .navbar-menu {
        width: 100%;
        justify-content: center;
      }

      .nav-link {
        font-size: 12px;
        padding: 6px 12px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .stat-card {
        padding: 20px;
      }

      .stat-icon {
        font-size: 40px;
      }

      .stat-number {
        font-size: 28px;
      }

      .modules-grid {
        grid-template-columns: 1fr;
      }

      .user-badge {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  usuario$ = this.authService.obtenerUsuario();
  stats: DashboardStats | null = null;
  cargando = false;
  errorMensaje = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    this.cargando = true;
    this.errorMensaje = '';

    // Inicializar con datos predeterminados
    this.stats = {
      vehiculos: { total: 0, disponibles: 0, enUso: 0, mantenimiento: 0 },
      reservas: { total: 0, pendientes: 0, activas: 0, completadas: 0 },
      reparaciones: { total: 0, enProceso: 0, completadas: 0 },
      inventario: { total: 0, bajoStock: 0 },
      conductores: { total: 0, activos: 0 }
    };

    // Cargar todas las estadísticas en una sola petición
    this.http.get<any>(`${environment.apiUrl}/api/dashboard/estadisticas`).subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          this.stats = response.data;
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
        this.cargando = false;
        // Mantener los valores en 0 si hay error
      }
    });
  }

  navegarA(ruta: string): void {
    this.router.navigate([ruta]);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}
