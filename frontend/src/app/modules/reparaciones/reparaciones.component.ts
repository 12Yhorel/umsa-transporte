import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReparacionesService, Reparacion } from './reparaciones.service';
import { VehiculosService } from '../vehiculos/vehiculos.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { Subject, Subscription } from 'rxjs';
import { switchMap, finalize, debounceTime, distinctUntilChanged, throttleTime } from 'rxjs/operators';

@Component({
  selector: 'app-reparaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reparaciones.component.html',
  styleUrls: ['./reparaciones.component.scss']
})
export class ReparacionesComponent implements OnInit, OnDestroy {
  reparaciones: Reparacion[] = [];
  vehiculos: any[] = [];
  tecnicos: any[] = [];
  cargando = false;
  errorMensaje = '';
  
  paginaActual = 1;
  limite = 20;
  paginacion: any = null;
  
  estadoFiltro = '';
  vehiculoFiltro = '';
  
  showForm = false;
  form: Partial<Reparacion> = {};
  
  showSeguimiento = false;
  reparacionSeleccionada: Reparacion | null = null;
  repuestosUtilizados: any[] = [];
  cargandoRepuestos = false;
  
  showCambioEstado = false;
  formCambioEstado: any = {
    nuevoEstado: '',
    observaciones: '',
    fecha_real_entrega: ''
  };
  
  private reload$ = new Subject<void>();
  private filtrosChanges = new Subject<void>();
  private subscriptions = new Subscription();

  estados = [
    { valor: '', label: 'Todos los estados' },
    { valor: 'RECIBIDO', label: 'Recibido' },
    { valor: 'DIAGNOSTICO', label: 'Diagnóstico' },
    { valor: 'EN_REPARACION', label: 'En Reparación' },
    { valor: 'TERMINADO', label: 'Terminado' },
    { valor: 'ENTREGADO', label: 'Entregado' }
  ];

  // Los tipos y otras opciones se eliminan ya que no existen en la BD

  constructor(
    private reparacionesService: ReparacionesService,
    private vehiculosService: VehiculosService,
    private usuariosService: UsuariosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarVehiculos();
    this.cargarTecnicos();

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
          
          return this.reparacionesService.listar(this.paginaActual, this.limite, filtros)
            .pipe(finalize(() => (this.cargando = false)));
        })
      ).subscribe({
        next: (res) => {
          this.reparaciones = res.reparaciones || [];
          this.paginacion = res.paginacion;
          if (!this.reparaciones.length && !this.cargando) {
            this.errorMensaje = 'No hay reparaciones registradas.';
          }
        },
        error: (err) => {
          console.error('Error cargando reparaciones', err);
          this.errorMensaje = this.traducirError(err);
          this.reparaciones = [];
        }
      })
    );

    // Primera carga al final
    this.reload$.next();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onFiltroChange(): void {
    this.filtrosChanges.next();
  }

  limpiarFiltros(): void {
    this.estadoFiltro = '';
    this.vehiculoFiltro = '';
    this.paginaActual = 1;
    this.reload$.next();
  }

  cargarVehiculos(): void {
    this.vehiculosService.listar(1, 1000, {}).subscribe({
      next: (res) => {
        console.log('Respuesta vehículos:', res);
        this.vehiculos = res.vehiculos || res.data?.vehiculos || res.data || [];
        console.log('Vehículos cargados:', this.vehiculos);
      },
      error: (err) => console.error('Error cargando vehículos:', err)
    });
  }

  cargarTecnicos(): void {
    // Primero obtener el rol TECNICO para obtener su ID
    this.usuariosService.obtenerRoles().subscribe({
      next: (roles) => {
        const rolTecnico = roles.find((r: any) => r.nombre === 'TECNICO');
        if (rolTecnico) {
          // Cargar usuarios con rol TECNICO
          this.usuariosService.listar(1, 1000, { rol_id: rolTecnico.id, activo: true }).subscribe({
            next: (res) => {
              console.log('Respuesta técnicos:', res);
              this.tecnicos = res.usuarios || [];
              console.log('Técnicos cargados:', this.tecnicos);
            },
            error: (err) => console.error('Error cargando técnicos:', err)
          });
        }
      },
      error: (err) => console.error('Error cargando roles:', err)
    });
  }

  nuevo(): void {
    this.form = { 
      vehiculo_id: 0,
      tecnico_id: 1, // ID del técnico (puede obtenerlo del usuario actual)
      fecha_recepcion: this.obtenerFechaActual(),
      fecha_estimada_entrega: '',
      fecha_real_entrega: '',
      descripcion_problema: '',
      diagnostico: '',
      estado: 'RECIBIDO',
      costo_total: 0
    };
    this.showForm = true;
  }

  editar(r: Reparacion): void {
    this.form = { ...r };
    this.showForm = true;
  }

  guardar(): void {
    const payload: any = { ...this.form };
    const id = (this.form as any).id;

    // Limpiar campos que no deben enviarse
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    delete payload.vehiculo;
    delete payload.placa;
    delete payload.marca;
    delete payload.modelo;
    delete payload.color;
    delete payload.kilometraje_actual;
    delete payload.tecnico_nombre;
    delete payload.tecnico_email;
    delete payload.total_repuestos;
    delete payload.costo_repuestos;
    delete payload.progreso;
    delete payload.dias_en_reparacion;
    delete payload.fecha_inicio;
    delete payload.fecha_fin;
    delete payload.descripcion;
    delete payload.costo;
    delete payload.mecanico;

    // Log temporal para depuración
    console.log('[DEBUG] Payload antes de enviar:', payload);

    if (id) {
      this.reparacionesService.actualizar(id, payload).subscribe({
        next: () => {
          this.showForm = false;
          this.form = {};
          this.reload$.next();
        },
        error: (e) => alert('Error actualizando: ' + this.traducirError(e))
      });
    } else {
      this.reparacionesService.crear(payload).subscribe({
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

  eliminar(r: Reparacion): void {
    if (!confirm(`¿Eliminar reparación del vehículo ${r.placa || r.vehiculo_id}?`)) return;
    
    this.reparacionesService.eliminar(r.id).subscribe({
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
      'RECIBIDO': 'badge-info',
      'DIAGNOSTICO': 'badge-warning',
      'EN_REPARACION': 'badge-primary',
      'TERMINADO': 'badge-success',
      'ENTREGADO': 'badge-success'
    };
    return clases[estado] || 'badge-secondary';
  }

  obtenerFechaActual(): string {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  }

  verSeguimiento(r: Reparacion): void {
    this.reparacionSeleccionada = r;
    this.showSeguimiento = true;
    this.repuestosUtilizados = [];
    this.cargarRepuestos(r.id);
  }

  cargarRepuestos(reparacionId: number): void {
    this.cargandoRepuestos = true;
    this.reparacionesService.obtenerRepuestos(reparacionId).subscribe({
      next: (repuestos) => {
        this.repuestosUtilizados = repuestos;
        this.cargandoRepuestos = false;
      },
      error: (err) => {
        console.error('Error cargando repuestos:', err);
        this.cargandoRepuestos = false;
      }
    });
  }

  cerrarSeguimiento(): void {
    this.showSeguimiento = false;
    this.reparacionSeleccionada = null;
    this.repuestosUtilizados = [];
  }

  calcularTotalRepuestos(): number {
    return this.repuestosUtilizados.reduce((total, rep) => {
      return total + (rep.cantidad * rep.costo_unitario);
    }, 0);
  }

  avanzarEstado(r: Reparacion): void {
    const estadosOrden: Array<'RECIBIDO' | 'DIAGNOSTICO' | 'EN_REPARACION' | 'TERMINADO' | 'ENTREGADO'> = 
      ['RECIBIDO', 'DIAGNOSTICO', 'EN_REPARACION', 'TERMINADO', 'ENTREGADO'];
    const indiceActual = estadosOrden.indexOf(r.estado || 'RECIBIDO');
    
    if (indiceActual === -1 || indiceActual >= estadosOrden.length - 1) {
      alert('La reparación ya está en el estado final');
      return;
    }
    
    const nuevoEstado = estadosOrden[indiceActual + 1];
    
    // Abrir modal para ingresar observaciones
    this.formCambioEstado = {
      reparacion: r,
      nuevoEstado: nuevoEstado,
      observaciones: '',
      fecha_real_entrega: (nuevoEstado === 'TERMINADO' || nuevoEstado === 'ENTREGADO') ? this.obtenerFechaActual() : ''
    };
    this.showCambioEstado = true;
  }

  confirmarCambioEstado(): void {
    if (!this.formCambioEstado.observaciones.trim()) {
      alert('Por favor ingrese las observaciones');
      return;
    }

    const payload: any = {
      estado: this.formCambioEstado.nuevoEstado,
      observaciones: this.formCambioEstado.observaciones
    };

    // Si es TERMINADO o ENTREGADO, incluir fecha_real_entrega
    if (this.formCambioEstado.nuevoEstado === 'TERMINADO' || this.formCambioEstado.nuevoEstado === 'ENTREGADO') {
      if (!this.formCambioEstado.fecha_real_entrega) {
        alert('Por favor ingrese la fecha de entrega real');
        return;
      }
      payload.fecha_real_entrega = this.formCambioEstado.fecha_real_entrega;
    }
    
    this.reparacionesService.cambiarEstado(this.formCambioEstado.reparacion.id, this.formCambioEstado.nuevoEstado, payload).subscribe({
      next: () => {
        this.showCambioEstado = false;
        this.reload$.next();
        if (this.reparacionSeleccionada && this.reparacionSeleccionada.id === this.formCambioEstado.reparacion.id) {
          this.reparacionSeleccionada.estado = this.formCambioEstado.nuevoEstado;
        }
      },
      error: (e) => alert('Error: ' + this.traducirError(e))
    });
  }

  cancelarCambioEstado(): void {
    this.showCambioEstado = false;
    this.formCambioEstado = {
      nuevoEstado: '',
      observaciones: '',
      fecha_real_entrega: ''
    };
  }

  getNombreEstado(estado: string): string {
    const nombres: any = {
      'RECIBIDO': 'Recibido',
      'DIAGNOSTICO': 'Diagnóstico',
      'EN_REPARACION': 'En Reparación',
      'TERMINADO': 'Terminado',
      'ENTREGADO': 'Entregado'
    };
    return nombres[estado] || estado;
  }

  getEstadoIndice(estado: string): number {
    const estadosOrden = ['RECIBIDO', 'DIAGNOSTICO', 'EN_REPARACION', 'TERMINADO', 'ENTREGADO'];
    return estadosOrden.indexOf(estado || 'RECIBIDO');
  }

  puedeAvanzar(estado: string): boolean {
    return estado !== 'ENTREGADO';
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

  descargarReportePDF(): void {
    const filtros: any = {};
    if (this.estadoFiltro) filtros.estado = this.estadoFiltro;
    this.reparacionesService.descargarReportePDF(filtros);
  }
}
