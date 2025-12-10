import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReservasService, Reserva } from './reservas.service';
import { VehiculosService } from '../vehiculos/vehiculos.service';
import { ConductoresService } from '../conductores/conductores.service';
import { Subject, Subscription } from 'rxjs';
import { switchMap, finalize, debounceTime, distinctUntilChanged, throttleTime } from 'rxjs/operators';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservas.component.html',
  styleUrls: ['./reservas.component.scss']
})
export class ReservasComponent implements OnInit, OnDestroy {
  reservas: Reserva[] = [];
  vehiculos: any[] = [];
  conductores: any[] = [];
  cargando = false;
  errorMensaje = '';
  
  paginaActual = 1;
  limite = 20;
  paginacion: any = null;
  
  busqueda = '';
  estadoFiltro = '';
  vehiculoFiltro = '';
  
  showForm = false;
  form: Partial<Reserva> = {};
  
  private reload$ = new Subject<void>();
  private busquedaChanges = new Subject<string>();
  private filtrosChanges = new Subject<void>();
  private subscriptions = new Subscription();

  estados = [
    { valor: '', label: 'Todos los estados' },
    { valor: 'PENDIENTE', label: 'Pendiente' },
    { valor: 'APROBADA', label: 'Aprobada' },
    { valor: 'RECHAZADA', label: 'Rechazada' },
    { valor: 'COMPLETADA', label: 'Completada' },
    { valor: 'CANCELADA', label: 'Cancelada' }
  ];

  constructor(
    private reservasService: ReservasService,
    private vehiculosService: VehiculosService,
    private conductoresService: ConductoresService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.busquedaChanges.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe((term) => {
        this.busqueda = term;
        this.paginaActual = 1;
        this.reload$.next();
      })
    );

    this.subscriptions.add(
      this.filtrosChanges.pipe(
        throttleTime(300, undefined, { leading: false, trailing: true })
      ).subscribe(() => {
        this.paginaActual = 1;
        this.reload$.next();
      })
    );

    this.subscriptions.add(
      this.reload$.pipe(
        switchMap(() => {
          this.cargando = true;
          this.errorMensaje = '';
          const filtros: any = {};
          
          if (this.estadoFiltro) filtros.estado = this.estadoFiltro;
          if (this.vehiculoFiltro) filtros.vehiculo_id = this.vehiculoFiltro;
          if (this.busqueda) filtros.busqueda = this.busqueda;
          
          return this.reservasService.listar(this.paginaActual, this.limite, filtros)
            .pipe(finalize(() => (this.cargando = false)));
        })
      ).subscribe({
        next: (res) => {
          this.reservas = res.reservas || [];
          this.paginacion = res.paginacion;
          if (!this.reservas.length && !this.cargando) {
            this.errorMensaje = this.busqueda ? 'Sin resultados.' : 'No hay reservas registradas.';
          }
        },
        error: (err) => {
          console.error('Error cargando reservas', err);
          this.errorMensaje = this.traducirError(err);
          this.reservas = [];
        }
      })
    );

    this.reload$.next();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onBusquedaInput(valor: string): void {
    this.busquedaChanges.next(valor.trim());
  }

  onFiltroChange(): void {
    this.filtrosChanges.next();
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.estadoFiltro = '';
    this.vehiculoFiltro = '';
    this.paginaActual = 1;
    this.reload$.next();
  }

  descargarReportePDF(): void {
    const filtros: any = {};
    if (this.estadoFiltro) filtros.estado = this.estadoFiltro;
    if (this.vehiculoFiltro) filtros.vehiculo_id = this.vehiculoFiltro;
    this.reservasService.descargarReportePDF(filtros);
  }

  nuevo(): void {
    this.cargarDatosFormulario();
    const hoy = new Date().toISOString().split('T')[0];
    this.form = { 
      estado: 'PENDIENTE',
      fecha_reserva: hoy,
      hora_inicio: '08:00',
      hora_fin: '17:00',
      nombre_unidad: ''
    };
    this.showForm = true;
  }

  editar(r: Reserva): void {
    this.cargarDatosFormulario();
    this.form = { ...r };
    this.showForm = true;
  }

  cargarDatosFormulario(): void {
    // Cargar vehículos disponibles
    this.vehiculosService.listar(1, 1000, { estado: 'DISPONIBLE' }).subscribe({
      next: (res) => {
        this.vehiculos = res.vehiculos || [];
      },
      error: (e) => {
        console.error('Error cargando vehículos:', e);
        this.vehiculos = [];
      }
    });

    // Cargar conductores habilitados
    this.conductoresService.listar(1, 1000, { estado: 'ACTIVO' }).subscribe({
      next: (res) => {
        this.conductores = res.conductores || [];
      },
      error: (e) => {
        console.error('Error cargando conductores:', e);
        this.conductores = [];
      }
    });
  }

  guardar(): void {
    const payload: any = { ...this.form };
    const id = (this.form as any).id;

    if (id) {
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;
      delete payload.fecha_solicitud;
      delete payload.fecha_aprobacion;
      delete payload.aprobado_por;
      delete payload.vehiculo;
      delete payload.conductor;
      delete payload.solicitante;
      
      this.reservasService.actualizar(id, payload).subscribe({
        next: () => {
          this.showForm = false;
          this.form = {};
          this.reload$.next();
        },
        error: (e) => alert('Error actualizando: ' + this.traducirError(e))
      });
    } else {
      this.reservasService.crear(payload).subscribe({
        next: () => {
          this.showForm = false;
          this.form = {};
          this.reload$.next();
        },
        error: (e) => alert('Error creando: ' + this.traducirError(e))
      });
    }
  }

  cancelar(): void {
    this.showForm = false;
    this.form = {};
  }

  cambiarEstado(r: Reserva, nuevoEstado: string): void {
    if (!confirm(`¿Cambiar estado de la reserva a ${nuevoEstado}?`)) return;
    
    this.reservasService.cambiarEstado(r.id, nuevoEstado).subscribe({
      next: () => this.reload$.next(),
      error: (e) => alert('Error: ' + this.traducirError(e))
    });
  }

  eliminar(r: Reserva): void {
    if (!confirm(`¿Eliminar reserva del ${r.fecha_reserva}?`)) return;
    
    this.reservasService.eliminar(r.id).subscribe({
      next: () => this.reload$.next(),
      error: (e) => alert('Error: ' + this.traducirError(e))
    });
  }

  cambiarPagina(p: number): void {
    if (!this.paginacion) return;
    const total = this.paginacion.totalPaginas || 1;
    if (p < 1 || p > total) return;
    this.paginaActual = p;
    this.reload$.next();
  }

  getEstadoBadgeClass(estado: string): string {
    const clases: any = {
      'PENDIENTE': 'badge-warning',
      'APROBADA': 'badge-success',
      'RECHAZADA': 'badge-danger',
      'EN_CURSO': 'badge-info',
      'COMPLETADA': 'badge-secondary',
      'CANCELADA': 'badge-dark'
    };
    return clases[estado] || 'badge-secondary';
  }

  obtenerFechaActual(): string {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  }

  private traducirError(err: any): string {
    if (!err) return 'Error desconocido.';
    const status = err.status;
    if (status === 0) return 'No se pudo conectar.';
    if (status === 401) return 'No autorizado.';
    if (status === 403) return 'Permisos insuficientes.';
    if (status === 500) return 'Error del servidor.';
    return err.error?.message || 'Error.';
  }

  irAlDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
