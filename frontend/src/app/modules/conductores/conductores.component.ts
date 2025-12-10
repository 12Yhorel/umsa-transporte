import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConductoresService, Conductor } from './conductores.service';
import { UsuariosService, Usuario } from '../usuarios/usuarios.service';
import { Subject, Subscription } from 'rxjs';
import { switchMap, finalize, debounceTime, distinctUntilChanged, throttleTime } from 'rxjs/operators';

@Component({
  selector: 'app-conductores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conductores.component.html',
  styleUrls: ['./conductores.component.scss']
})
export class ConductoresComponent implements OnInit, OnDestroy {
  conductores: Conductor[] = [];
  usuarios: Usuario[] = [];
  cargando = false;
  errorMensaje = '';
  
  paginaActual = 1;
  limite = 20;
  paginacion: any = null;
  
  busqueda = '';
  habilitadoFiltro = '';
  
  showForm = false;
  form: Partial<Conductor> = {};
  
  private reload$ = new Subject<void>();
  private busquedaChanges = new Subject<string>();
  private filtrosChanges = new Subject<void>();
  private subscriptions = new Subscription();

  opcionesHabilitado = [
    { valor: '', label: 'Todos' },
    { valor: 'true', label: 'Habilitados' },
    { valor: 'false', label: 'Deshabilitados' }
  ];

  categorias = [
    { valor: 'A', label: 'A - Automóviles' },
    { valor: 'B', label: 'B - Camionetas y Minibuses' },
    { valor: 'C', label: 'C - Camiones o Buses' },
    { valor: 'G', label: 'G - Maquinaria Pesada' }
  ];

  constructor(
    private conductoresService: ConductoresService,
    private usuariosService: UsuariosService,
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
          
          // Mapear habilitado: 'true' -> ACTIVO, 'false' -> INACTIVO
          if (this.habilitadoFiltro === 'true') filtros.estado = 'ACTIVO';
          else if (this.habilitadoFiltro === 'false') filtros.estado = 'INACTIVO';
          
          if (this.busqueda) filtros.busqueda = this.busqueda;
          
          return this.conductoresService.listar(this.paginaActual, this.limite, filtros)
            .pipe(finalize(() => (this.cargando = false)));
        })
      ).subscribe({
        next: (res) => {
          this.conductores = res.conductores || [];
          this.paginacion = res.paginacion;
          if (!this.conductores.length && !this.cargando) {
            this.errorMensaje = this.busqueda ? 'Sin resultados.' : 'No hay conductores registrados.';
          }
        },
        error: (err) => {
          console.error('Error cargando conductores', err);
          this.errorMensaje = this.traducirError(err);
          this.conductores = [];
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
    this.habilitadoFiltro = '';
    this.paginaActual = 1;
    this.reload$.next();
  }

  descargarReportePDF(): void {
    const filtros: any = {};
    if (this.habilitadoFiltro) filtros.habilitado = this.habilitadoFiltro;
    this.conductoresService.descargarReportePDF(filtros);
  }

  nuevo(): void {
    this.cargarUsuarios();
    this.form = { 
      habilitado: true,
      licencia_categoria: 'B'
    };
    this.showForm = true;
  }

  editar(c: Conductor): void {
    this.cargarUsuarios();
    this.form = { ...c };
    this.showForm = true;
  }

  cargarUsuarios(): void {
    this.usuariosService.listar(1, 1000, { activo: true, rol_id: 3 }).subscribe({
      next: (res) => {
        this.usuarios = res.usuarios || [];
      },
      error: (e) => {
        console.error('Error cargando usuarios:', e);
        this.usuarios = [];
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
      delete payload.nombres;
      delete payload.apellidos;
      delete payload.email;
      delete payload.departamento;
      delete payload.telefono_usuario;
      delete payload.dias_vencimiento_licencia;
      delete payload.licencia_proxima_vencer;
      delete payload.licencia_vencida;
      
      this.conductoresService.actualizar(id, payload).subscribe({
        next: () => {
          this.showForm = false;
          this.form = {};
          this.reload$.next();
        },
        error: (e) => alert('Error actualizando: ' + this.traducirError(e))
      });
    } else {
      this.conductoresService.crear(payload).subscribe({
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

  toggleHabilitado(c: Conductor): void {
    const nuevoEstado = !c.habilitado;
    const texto = nuevoEstado ? 'habilitar' : 'deshabilitar';
    
    if (!confirm(`¿Desea ${texto} al conductor ${c.nombres} ${c.apellidos}?`)) return;
    
    this.conductoresService.cambiarHabilitacion(c.id, nuevoEstado).subscribe({
      next: () => this.reload$.next(),
      error: (e) => alert('Error: ' + this.traducirError(e))
    });
  }

  eliminar(c: Conductor): void {
    if (!confirm(`¿Eliminar conductor ${c.nombres} ${c.apellidos}?`)) return;
    
    this.conductoresService.eliminar(c.id).subscribe({
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

  getLicenciaClass(conductor: Conductor): string {
    if (conductor.licencia_vencida) return 'badge-danger';
    if (conductor.licencia_proxima_vencer) return 'badge-warning';
    return 'badge-success';
  }

  getLicenciaTexto(conductor: Conductor): string {
    if (conductor.licencia_vencida) return 'Vencida';
    if (conductor.licencia_proxima_vencer) return `Vence en ${conductor.dias_vencimiento_licencia} días`;
    return 'Vigente';
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
