import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VehiculosService, Vehiculo } from './vehiculos.service';
import { Subject, Subscription } from 'rxjs';
import { switchMap, finalize, debounceTime, distinctUntilChanged, throttleTime } from 'rxjs/operators';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehiculos.component.html',
  styleUrls: ['./vehiculos.component.scss']
})
export class VehiculosComponent implements OnInit, OnDestroy {
  vehiculos: Vehiculo[] = [];
  cargando = false;
  errorMensaje = '';
  
  paginaActual = 1;
  limite = 20;
  paginacion: any = null;
  
  busqueda = '';
  estadoFiltro = '';
  combustibleFiltro = '';
  
  showForm = false;
  form: Partial<Vehiculo> = {};
  anioActual = new Date().getFullYear();
  
  private reload$ = new Subject<void>();
  private busquedaChanges = new Subject<string>();
  private filtrosChanges = new Subject<void>();
  private subscriptions = new Subscription();

  estados = [
    { valor: '', label: 'Todos los estados' },
    { valor: 'DISPONIBLE', label: 'Disponible' },
    { valor: 'EN_USO', label: 'En Uso' },
    { valor: 'EN_REPARACION', label: 'En Reparación' },
    { valor: 'INACTIVO', label: 'Inactivo' }
  ];

  combustibles = [
    { valor: '', label: 'Todos' },
    { valor: 'GASOLINA', label: 'Gasolina' },
    { valor: 'DIESEL', label: 'Diésel' },
    { valor: 'ELECTRICO', label: 'Eléctrico' },
    { valor: 'HIBRIDO', label: 'Híbrido' }
  ];

  constructor(
    private vehiculosService: VehiculosService,
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
          if (this.combustibleFiltro) filtros.tipo_combustible = this.combustibleFiltro;
          if (this.busqueda) filtros.busqueda = this.busqueda;
          
          return this.vehiculosService.listar(this.paginaActual, this.limite, filtros)
            .pipe(finalize(() => (this.cargando = false)));
        })
      ).subscribe({
        next: (res) => {
          this.vehiculos = res.vehiculos || [];
          this.paginacion = res.paginacion;
          if (!this.vehiculos.length && !this.cargando) {
            this.errorMensaje = this.busqueda ? 'Sin resultados para la búsqueda.' : 'No hay vehículos registrados.';
          }
        },
        error: (err) => {
          console.error('Error cargando vehículos', err);
          this.errorMensaje = this.traducirError(err);
          this.vehiculos = [];
        }
      })
    );

    // Trigger inicial DESPUÉS de suscribirse
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
    this.combustibleFiltro = '';
    this.paginaActual = 1;
    this.reload$.next();
  }

  descargarReportePDF(): void {
    const filtros: any = {};
    if (this.estadoFiltro) filtros.estado = this.estadoFiltro;
    if (this.combustibleFiltro) filtros.tipo_combustible = this.combustibleFiltro;
    this.vehiculosService.descargarReportePDF(filtros);
  }

  nuevo(): void {
    this.form = {
      tipo_combustible: 'GASOLINA',
      estado: 'DISPONIBLE',
      kilometraje_actual: 0
    };
    this.showForm = true;
  }

  editar(v: Vehiculo): void {
    this.form = { ...v };
    this.showForm = true;
  }

  guardar(): void {
    const payload: any = { ...this.form };
    const id = (this.form as any).id;

    if (id) {
      delete payload.id;
      this.vehiculosService.actualizar(id, payload).subscribe({
        next: () => {
          this.showForm = false;
          this.form = {};
          this.reload$.next();
        },
        error: (e) => alert('Error actualizando: ' + e.message)
      });
    } else {
      this.vehiculosService.crear(payload).subscribe({
        next: () => {
          this.showForm = false;
          this.form = {};
          this.reload$.next();
        },
        error: (e) => alert('Error creando: ' + e.message)
      });
    }
  }

  cancelar(): void {
    this.showForm = false;
    this.form = {};
  }

  cambiarEstado(v: Vehiculo, nuevoEstado: string): void {
    if (!confirm(`Cambiar estado de ${v.placa} a ${nuevoEstado}?`)) return;
    
    this.vehiculosService.cambiarEstado(v.id, nuevoEstado).subscribe({
      next: () => this.reload$.next(),
      error: (e) => alert('Error cambiando estado: ' + e.message)
    });
  }

  eliminar(v: Vehiculo): void {
    if (!confirm(`Eliminar vehículo ${v.placa}? Esta acción no se puede deshacer.`)) return;
    
    this.vehiculosService.eliminar(v.id).subscribe({
      next: () => this.reload$.next(),
      error: (e) => alert('Error eliminando: ' + this.traducirError(e))
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
      'DISPONIBLE': 'badge-success',
      'EN_USO': 'badge-info',
      'EN_MANTENIMIENTO': 'badge-warning',
      'FUERA_DE_SERVICIO': 'badge-danger'
    };
    return clases[estado] || 'badge-secondary';
  }

  private traducirError(err: any): string {
    if (!err) return 'Error desconocido.';
    const status = err.status;
    if (status === 0) return 'No se pudo conectar con el servidor.';
    if (status === 401) return 'No autorizado. Inicie sesión nuevamente.';
    if (status === 403) return 'Permisos insuficientes.';
    if (status === 500) return 'Error interno del servidor.';
    return err.error?.message || 'Error al procesar la solicitud.';
  }

  irAlDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
