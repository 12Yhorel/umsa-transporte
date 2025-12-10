import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, throttleTime, switchMap, finalize } from 'rxjs/operators';
import { InventarioService, ItemInventario, Categoria, Proveedor, Paginacion, Movimiento } from './inventario.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss']
})
export class InventarioComponent implements OnInit, OnDestroy {
  items: ItemInventario[] = [];
  categorias: Categoria[] = [];
  cargando = false;
  errorMensaje = '';

  // Paginación
  paginacion: Paginacion = { pagina: 1, limite: 20, total: 0, totalPaginas: 0 };
  paginaActual = 1;
  limite = 20;

  // Filtros
  categoriaFiltro: number | null = null;
  busqueda = '';
  solobajoStock = false;
  incluirDesactivados = false;
  private busquedaChanges = new Subject<string>();
  private filtrosChanges = new Subject<void>();

  // Formulario
  mostrarFormulario = false;
  modoEdicion = false;
  itemSeleccionado: ItemInventario | null = null;
  itemForm: Partial<ItemInventario> = this.nuevoItemVacio();

  // Modal de movimientos
  mostrarModalMovimientos = false;
  tipoMovimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE' = 'ENTRADA';
  cantidadMovimiento = 0;
  motivoMovimiento = '';
  nuevoStockAjuste = 0;

  // Historial movimientos
  mostrarHistorial = false;
  movimientos: Movimiento[] = [];

  private subscriptions = new Subscription();
  private listarSub: Subscription | null = null;
  private reload$ = new Subject<void>();

  constructor(
    private inventarioService: InventarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Cargar datos base una sola vez
    this.cargarCategorias();

    // Debounce para búsqueda
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

    // Throttle para cambios de filtros (categoría/proveedor/bajo stock)
    this.subscriptions.add(
      this.filtrosChanges.pipe(
        // Evita múltiples disparos seguidos
        throttleTime(300, undefined, { trailing: true })
      ).subscribe(() => {
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
            if (this.categoriaFiltro) filtros.categoria_id = this.categoriaFiltro;
            if (this.busqueda) filtros.busqueda = this.busqueda;
            if (this.solobajoStock) filtros.bajo_stock = true;
            if (this.incluirDesactivados) filtros.incluir_desactivados = true;

            return this.inventarioService
              .listar(this.paginaActual, this.limite, filtros)
              .pipe(finalize(() => (this.cargando = false)));
          })
        )
        .subscribe({
          next: (resultado) => {
            this.items = resultado.items;
            this.paginacion = resultado.paginacion;
          },
          error: (err) => {
            this.errorMensaje = this.traducirError(err);
          },
        })
    );

    // Primera carga al final para que se ejecute después de configurar todas las suscripciones
    this.reload$.next();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Eliminar cargas redundantes: categorías y proveedores se cargan una vez en ngOnInit

  // cargarItems ahora delega en reload$ para manejar cancelación automática
  cargarItems(): void {
    this.reload$.next();
  }

  cargarCategorias(): void {
    const sub = this.inventarioService.obtenerCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
      }
    });

    this.subscriptions.add(sub);
  }

  aplicarFiltros(): void {
    this.filtrosChanges.next();
  }

  limpiarFiltros(): void {
    this.categoriaFiltro = null;
    this.busqueda = '';
    this.busquedaChanges.next('');
    this.solobajoStock = false;
    this.incluirDesactivados = false;
    this.filtrosChanges.next();
  }

  descargarReportePDF(): void {
    const filtros: any = {};
    if (this.categoriaFiltro) filtros.categoria_id = this.categoriaFiltro;
    if (this.solobajoStock) filtros.bajo_stock = 'true';
    this.inventarioService.descargarReportePDF(filtros);
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.paginacion.totalPaginas) return;
    this.paginaActual = pagina;
    this.cargarItems();
  }

  obtenerPaginas(): number[] {
    const paginas: number[] = [];
    const maxPaginas = 5;
    let inicio = Math.max(1, this.paginaActual - Math.floor(maxPaginas / 2));
    let fin = Math.min(this.paginacion.totalPaginas, inicio + maxPaginas - 1);

    if (fin - inicio < maxPaginas - 1) {
      inicio = Math.max(1, fin - maxPaginas + 1);
    }

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  nuevoItem(): void {
    this.modoEdicion = false;
    this.itemSeleccionado = null;
    this.itemForm = this.nuevoItemVacio();
    this.mostrarFormulario = true;
  }

  editarItem(item: ItemInventario): void {
    this.modoEdicion = true;
    this.itemSeleccionado = item;
    this.itemForm = { ...item };
    this.mostrarFormulario = true;
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.modoEdicion = false;
    this.itemSeleccionado = null;
    this.itemForm = this.nuevoItemVacio();
  }

  guardarItem(): void {
    if (!this.itemForm.nombre || !this.itemForm.categoria_id) {
      alert('Nombre y categoría son requeridos');
      return;
    }

    this.cargando = true;

    if (this.modoEdicion && this.itemSeleccionado) {
      // Eliminar campos de solo lectura antes de enviar
      const payload: any = { ...this.itemForm };
      delete payload.id;
      delete payload.codigo_qr;
      delete payload.categoria_nombre;
      delete payload.categoria_tipo;
      delete payload.estado_stock;
      delete payload.activo;
      delete payload.creado_en;
      delete payload.actualizado_en;

      const sub = this.inventarioService.actualizar(this.itemSeleccionado.id, payload).subscribe({
        next: () => {
          this.reload$.next();
          this.cancelarFormulario();
          this.cargando = false;
        },
        error: (err) => {
          this.errorMensaje = this.traducirError(err);
          this.cargando = false;
        }
      });
      this.subscriptions.add(sub);
    } else {
      const sub = this.inventarioService.crear(this.itemForm).subscribe({
        next: () => {
          this.reload$.next();
          this.cancelarFormulario();
          this.cargando = false;
        },
        error: (err) => {
          this.errorMensaje = this.traducirError(err);
          this.cargando = false;
        }
      });
      this.subscriptions.add(sub);
    }
  }

  // Vincular cambios de input de búsqueda al Subject con debounce
  onBusquedaInput(valor: string): void {
    this.busquedaChanges.next(valor.trim());
  }

  desactivarItem(item: ItemInventario): void {
    if (!confirm(`¿Está seguro de desactivar el item "${item.nombre}"?`)) {
      return;
    }

    const sub = this.inventarioService.desactivar(item.id).subscribe({
      next: () => {
        this.cargarItems();
      },
      error: (err) => {
        this.errorMensaje = this.traducirError(err);
      }
    });

    this.subscriptions.add(sub);
  }

  abrirModalMovimientos(item: ItemInventario, tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE'): void {
    this.itemSeleccionado = item;
    this.tipoMovimiento = tipo;
    this.cantidadMovimiento = 0;
    this.motivoMovimiento = '';
    this.nuevoStockAjuste = item.stock_actual;
    this.mostrarModalMovimientos = true;
  }

  cerrarModalMovimientos(): void {
    this.mostrarModalMovimientos = false;
    this.itemSeleccionado = null;
    this.cantidadMovimiento = 0;
    this.motivoMovimiento = '';
  }

  registrarMovimiento(): void {
    if (!this.itemSeleccionado) return;

    if (this.tipoMovimiento !== 'AJUSTE' && this.cantidadMovimiento <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    if (this.tipoMovimiento === 'SALIDA' && !this.motivoMovimiento) {
      alert('El motivo es requerido para salidas');
      return;
    }

    this.cargando = true;
    let obs;

    if (this.tipoMovimiento === 'ENTRADA') {
      obs = this.inventarioService.registrarEntrada(
        this.itemSeleccionado.id,
        this.cantidadMovimiento,
        this.motivoMovimiento || 'Reposición de stock'
      );
    } else if (this.tipoMovimiento === 'SALIDA') {
      obs = this.inventarioService.registrarSalida(
        this.itemSeleccionado.id,
        this.cantidadMovimiento,
        this.motivoMovimiento
      );
    } else {
      obs = this.inventarioService.ajustarStock(
        this.itemSeleccionado.id,
        this.nuevoStockAjuste,
        this.motivoMovimiento || 'Ajuste de inventario'
      );
    }

    const sub = obs.subscribe({
      next: () => {
        this.cargarItems();
        this.cerrarModalMovimientos();
        this.cargando = false;
      },
      error: (err) => {
        this.errorMensaje = this.traducirError(err);
        this.cargando = false;
      }
    });

    this.subscriptions.add(sub);
  }

  verHistorial(item: ItemInventario): void {
    this.itemSeleccionado = item;
    this.mostrarHistorial = true;

    const sub = this.inventarioService.obtenerMovimientos(item.id, 50).subscribe({
      next: (movimientos) => {
        this.movimientos = movimientos;
      },
      error: (err) => {
        console.error('Error al cargar historial:', err);
      }
    });

    this.subscriptions.add(sub);
  }

  cerrarHistorial(): void {
    this.mostrarHistorial = false;
    this.itemSeleccionado = null;
    this.movimientos = [];
  }

  obtenerClaseEstadoStock(estado: string): string {
    switch (estado) {
      case 'BAJO': return 'badge bg-danger';
      case 'NORMAL': return 'badge bg-success';
      case 'ALTO': return 'badge bg-warning';
      default: return 'badge bg-secondary';
    }
  }

  obtenerClaseTipoMovimiento(tipo: string): string {
    switch (tipo) {
      case 'ENTRADA': return 'badge bg-success';
      case 'SALIDA': return 'badge bg-danger';
      case 'AJUSTE': return 'badge bg-warning';
      case 'TRASLADO': return 'badge bg-info';
      default: return 'badge bg-secondary';
    }
  }

  nuevoItemVacio(): Partial<ItemInventario> {
    return {
      nombre: '',
      descripcion: '',
      categoria_id: 0,
      stock_actual: 0,
      stock_minimo: 5,
      stock_maximo: 100,
      unidad_medida: 'UNIDAD',
      precio_unitario: undefined,
      ubicacion: ''
    };
  }

  traducirError(err: any): string {
    if (err.status === 401) return 'No autorizado. Por favor, inicie sesión nuevamente.';
    if (err.status === 403) return 'No tiene permisos para realizar esta acción.';
    if (err.status === 404) return 'Item no encontrado.';
    if (err.error?.message) return err.error.message;
    return 'Error al procesar la solicitud.';
  }

  irAlDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Descargar código QR de un ítem
   */
  descargarQR(item: ItemInventario): void {
    if (confirm(`¿Descargar código QR para "${item.nombre}"?`)) {
      this.cargando = true;
      this.inventarioService.descargarQR(item.id, item.nombre);
      setTimeout(() => {
        this.cargando = false;
      }, 1000);
    }
  }

  /**
   * Generar códigos QR para todos los items
   */
  generarQRMasivo(): void {
    if (confirm('¿Generar códigos QR para TODOS los items del inventario?\n\nEsto puede tomar algunos minutos.')) {
      this.cargando = true;
      this.errorMensaje = '';

      this.inventarioService.generarQRMasivo().subscribe({
        next: (response) => {
          this.cargando = false;
          if (response.success) {
            alert(`Códigos QR generados exitosamente:\n\n` +
                  `✅ Generados: ${response.data.generados}\n` +
                  `❌ Errores: ${response.data.errores}\n` +
                  `📦 Total: ${response.data.total}`);
          }
        },
        error: (err) => {
          this.cargando = false;
          this.errorMensaje = this.traducirError(err);
          console.error('Error al generar QR masivo:', err);
        }
      });
    }
  }
}
