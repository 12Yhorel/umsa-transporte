import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService, Usuario } from './usuarios.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mt-4">
      <div *ngIf="errorMensaje" class="alert alert-danger py-2 px-3 mb-2">
        {{ errorMensaje }}
        <button class="btn btn-sm btn-outline-light ms-2" (click)="cargar()">Reintentar</button>
      </div>
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div class="d-flex align-items-center">
          <h1 class="h4 mb-0 me-3">👥 Gestión de Usuarios</h1>
          <button class="btn btn-outline-secondary btn-sm" (click)="irAlDashboard()">← Dashboard</button>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-secondary btn-sm" (click)="descargarReportePDF()">📄 Reporte PDF</button>
          <input class="form-control" placeholder="Buscar por nombre o email" [(ngModel)]="q" (input)="onBusquedaInput($event)" (keyup.enter)="buscar()" style="min-width:300px" />
        </div>
      </div>

      <div class="card">
        <div class="card-body p-0">
          <div class="p-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <button class="btn btn-primary btn-sm" (click)="showForm = true; cargarRoles()">Nuevo usuario</button>
              <div class="btn-group" role="group">
                <button type="button" class="btn btn-sm" [class.btn-primary]="estadoFiltro === ''" [class.btn-outline-secondary]="estadoFiltro !== ''" (click)="filtrarPorEstado('')">Todos</button>
                <button type="button" class="btn btn-sm" [class.btn-success]="estadoFiltro === 'true'" [class.btn-outline-secondary]="estadoFiltro !== 'true'" (click)="filtrarPorEstado('true')">Activos</button>
                <button type="button" class="btn btn-sm" [class.btn-danger]="estadoFiltro === 'false'" [class.btn-outline-secondary]="estadoFiltro !== 'false'" (click)="filtrarPorEstado('false')">Desactivados</button>
              </div>
            </div>

            <div *ngIf="showForm" class="card mb-3">
              <div class="card-body">
                <h5 class="card-title mb-3">{{ form.id ? 'Editar Usuario' : 'Nuevo Usuario' }}</h5>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Email *</label>
                    <input class="form-control" type="email" placeholder="usuario@umsa.edu.bo" [(ngModel)]="form.email" required />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">{{ form.id ? 'Contraseña (dejar vacío para mantener)' : 'Contraseña *' }}</label>
                    <input class="form-control" type="password" placeholder="Contraseña" [(ngModel)]="form.password" [required]="!form.id" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Nombres *</label>
                    <input class="form-control" placeholder="Juan Carlos" [(ngModel)]="form.nombres" required />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Apellidos *</label>
                    <input class="form-control" placeholder="Pérez García" [(ngModel)]="form.apellidos" required />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Teléfono</label>
                    <input class="form-control" type="tel" placeholder="77123456" [(ngModel)]="form.telefono" maxlength="15" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Departamento</label>
                    <input class="form-control" placeholder="TI, Taller, etc." [(ngModel)]="form.departamento" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Rol *</label>
                    <select class="form-select" [(ngModel)]="form.rol_id" required>
                      <option [ngValue]="undefined">Seleccione rol</option>
                      <option *ngFor="let r of roles" [value]="r.id">{{ r.nombre }}</option>
                    </select>
                  </div>
                  <div class="col-12">
                    <button class="btn btn-success" (click)="guardar()">
                      {{ form.id ? 'Actualizar' : 'Crear' }} Usuario
                    </button>
                    <button class="btn btn-secondary ms-2" (click)="cancelar()">Cancelar</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Nombre Completo</th>
                <th>Teléfono</th>
                <th>Departamento</th>
                <th>Rol</th>
                <th>Activo</th>
                <th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="cargando">
                <td colspan="8" class="p-4 text-center">
                  <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                  Cargando usuarios...
                </td>
              </tr>
              <tr *ngFor="let u of usuarios">
                <td>{{ u.id }}</td>
                <td>{{ u.email }}</td>
                <td>{{ u.nombres }} {{ u.apellidos }}</td>
                <td>{{ u.telefono || '-' }}</td>
                <td>{{ u.departamento || '-' }}</td>
                <td>
                  <span class="badge bg-info">{{ u.rol_nombre }}</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="u.activo ? 'bg-success' : 'bg-secondary'">{{ u.activo ? 'Sí' : 'No' }}</span>
                </td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary me-1" (click)="editar(u)">Editar</button>
                  <button *ngIf="u.activo" class="btn btn-sm btn-warning me-1" (click)="desactivar(u)">Desactivar</button>
                  <button *ngIf="!u.activo" class="btn btn-sm btn-success me-1" (click)="activar(u)">Activar</button>
                  <button class="btn btn-sm btn-outline-danger" (click)="eliminar(u)">Eliminar</button>
                </td>
              </tr>
              <tr *ngIf="usuarios.length === 0">
                <td colspan="8" class="text-center p-4">No se encontraron usuarios.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center mt-3">
        <div>
          <button class="btn btn-secondary btn-sm" (click)="cargar()">Actualizar</button>
        </div>
        <div>
          <small class="text-muted">Mostrando {{ usuarios.length }} usuarios</small>
        </div>
      </div>
      <nav *ngIf="paginacion" class="mt-2">
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" [class.disabled]="paginaActual===1">
            <button class="page-link" (click)="cambiarPagina(paginaActual-1)" [disabled]="paginaActual===1">«</button>
          </li>
          <li class="page-item" *ngFor="let p of [].constructor(paginacion.totalPaginas); let i = index" [class.active]="(i+1)===paginaActual">
            <button class="page-link" (click)="cambiarPagina(i+1)">{{ i+1 }}</button>
          </li>
          <li class="page-item" [class.disabled]="paginaActual===paginacion.totalPaginas">
            <button class="page-link" (click)="cambiarPagina(paginaActual+1)" [disabled]="paginaActual===paginacion.totalPaginas">»</button>
          </li>
        </ul>
      </nav>
    </div>
  `,
  styles: [``]
})
export class UsuariosComponent implements OnInit, OnDestroy {
  usuarios: Usuario[] = [];
  q: string = '';
  roles: any[] = [];
  showForm = false;
  form: Partial<Usuario & { password?: string }> = {};
  cargando = false;
  errorMensaje = '';
  paginacion: any = null;
  paginaActual = 1;
  limite = 10;
  rolFiltro: number | undefined = undefined;
  estadoFiltro: string = '';
  private subscriptions = new Subscription();
  private reload$ = new Subject<void>();
  private busquedaChanges = new Subject<string>();

  private authService = inject(AuthService);
  private router = inject(Router);

  constructor(private usuariosService: UsuariosService) {}

  ngOnInit(): void {
    // Evitar llamadas al backend si no estamos autenticados
    if (!this.authService.estaAutenticado()) {
      this.router.navigate(['/auth']);
      return;
    }

    // Debounce para búsqueda
    this.subscriptions.add(
      this.busquedaChanges.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe((term) => {
        this.q = term;
        this.paginaActual = 1;
        this.reload$.next();
      })
    );

    // Pipeline de recarga: cancela automáticamente la petición anterior
    this.subscriptions.add(
      this.reload$
        .pipe(
          switchMap(() => {
            this.cargando = true;
            this.errorMensaje = '';
            
            const filtros: any = {};
            if (this.estadoFiltro !== '') filtros.activo = this.estadoFiltro;
            if (this.rolFiltro) filtros.rol_id = this.rolFiltro;
            if (this.q && this.q.trim()) filtros.busqueda = this.q.trim();
            
            const obs = this.usuariosService.listar(this.paginaActual, this.limite, filtros);
            return obs.pipe(finalize(() => (this.cargando = false)));
          })
        )
        .subscribe({
          next: (res) => {
            console.log('[Usuarios] Respuesta:', res);
            this.usuarios = res.usuarios || [];
            this.paginacion = res.paginacion;
            if (!this.usuarios.length && !this.cargando) {
              this.errorMensaje = this.q ? 'Sin resultados para la búsqueda.' : 'No se recibieron usuarios del servidor.';
            }
          },
          error: (err) => {
            console.error('Error cargando usuarios', err);
            this.errorMensaje = this.traducirError(err);
            this.usuarios = [];
          }
        })
    );

    // Primera carga DESPUÉS de suscribirse
    this.reload$.next();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  cargar(): void {
    this.reload$.next();
  }

  descargarReportePDF(): void {
    const filtros: any = {};
    if (this.rolFiltro) filtros.rol_id = this.rolFiltro;
    if (this.estadoFiltro !== '') filtros.activo = this.estadoFiltro;
    this.usuariosService.descargarReportePDF(filtros);
  }

  cargarRoles(): void {
    this.usuariosService.obtenerRoles().subscribe({
      next: (res) => this.roles = res || [],
      error: () => this.roles = []
    });
  }

  buscar(): void {
    this.reload$.next();
  }

  onBusquedaInput(event: any): void {
    const valor = event.target.value;
    this.busquedaChanges.next(valor.trim());
  }

  filtrarPorEstado(estado: string): void {
    this.estadoFiltro = estado;
    this.paginaActual = 1;
    this.reload$.next();
  }

  editar(u: Usuario) {
    // cargar datos en formulario simple
    this.form = { ...u };
    this.showForm = true;
    this.cargarRoles();
  }

  desactivar(u: Usuario) {
    if (!confirm('Desactivar usuario ' + u.email + '?')) return;
    this.usuariosService.desactivar(u.id).subscribe({
      next: () => this.reload$.next(),
      error: (e) => alert('Error desactivando: ' + e.message)
    });
  }

  activar(u: Usuario) {
    if (!confirm('Activar usuario ' + u.email + '?')) return;
    this.usuariosService.activar(u.id).subscribe({
      next: () => this.reload$.next(),
      error: (e) => alert('Error activando: ' + e.message)
    });
  }

  // Crear o actualizar según form.id
  guardar(): void {
    const payload: any = { ...this.form };
    const id = (this.form as any).id;

    if (id) {
      delete payload.id;
      this.usuariosService.actualizar(id as number, payload).subscribe({
        next: () => { this.showForm = false; this.form = {}; this.reload$.next(); },
        error: (e) => alert('Error actualizando: ' + e.message)
      });
    } else {
      this.usuariosService.crear(payload).subscribe({
        next: () => { this.showForm = false; this.form = {}; this.reload$.next(); },
        error: (e) => alert('Error creando usuario: ' + e.message)
      });
    }
  }

  cancelar(): void {
    this.showForm = false;
    this.form = {};
  }

  private traducirError(err: any): string {
    if (!err) return 'Error desconocido.';
    const status = err.status;
    if (status === 0) return 'No se pudo conectar con el servidor.';
    if (status === 401) return 'No autorizado. Inicie sesión nuevamente.';
    if (status === 403) return 'Permisos insuficientes para ver usuarios.';
    if (status === 500) return 'Error interno del servidor.';
    return err.error?.message || 'Error al obtener usuarios.';
  }

  cambiarPagina(p: number) {
    if (!this.paginacion) return;
    const total = this.paginacion.totalPaginas || 1;
    if (p < 1 || p > total) return;
    this.paginaActual = p;
    this.reload$.next();
  }

  eliminar(u: Usuario) {
    if (!confirm(`¿Eliminar usuario ${u.email}? Esta acción es permanente y no se puede deshacer.`)) return;
    console.log('Eliminando usuario:', u.id);
    this.usuariosService.eliminar(u.id).subscribe({
      next: (response) => {
        console.log('Usuario eliminado exitosamente:', response);
        alert('Usuario eliminado exitosamente');
        this.reload$.next();
      },
      error: (err) => {
        console.error('Error eliminando usuario:', err);
        alert('Error eliminando: ' + (err.error?.message || err.message));
      }
    });
  }

  irAlDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
