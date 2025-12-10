import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ItemInventario {
  id: number;
  codigo_qr: string;
  nombre: string;
  descripcion?: string;
  categoria_id: number;
  categoria_nombre: string;
  categoria_tipo: 'LIMPIEZA' | 'REPUESTO' | 'HERRAMIENTA' | 'COMBUSTIBLE';
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number;
  unidad_medida: string;
  precio_unitario?: number;
  ubicacion?: string;
  activo: boolean;
  estado_stock: 'BAJO' | 'NORMAL' | 'ALTO';
  creado_en: string;
  actualizado_en?: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  tipo: 'LIMPIEZA' | 'REPUESTO' | 'HERRAMIENTA' | 'COMBUSTIBLE';
  descripcion?: string;
  activo: boolean;
}

export interface Proveedor {
  id: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo: boolean;
}

export interface Movimiento {
  id: number;
  item_id: number;
  tipo_movimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'TRASLADO';
  cantidad: number;
  stock_anterior: number;
  stock_actual: number;
  motivo: string;
  referencia_id?: number;
  tipo_referencia?: string;
  usuario_id: number;
  nombres?: string;
  apellidos?: string;
  observaciones?: string;
  creado_en: string;
}

export interface Paginacion {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private apiUrl = `${environment.apiUrl}/api/inventario`;
  // Cache simple en memoria para evitar vacíos por respuestas 304 sin body
  private ultimoListado: { items: ItemInventario[]; paginacion: Paginacion } | null = null;
  private cacheCategorias: Categoria[] | null = null;
  private cacheProveedores: Proveedor[] | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Listar items con filtros y paginación
   */
  listar(pagina: number = 1, limite: number = 20, filtros: any = {}): Observable<{ items: ItemInventario[], paginacion: Paginacion }> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('limite', limite.toString());

    if (filtros.categoria_id) {
      params = params.set('categoria_id', filtros.categoria_id);
    }

    if (filtros.proveedor_id) {
      params = params.set('proveedor_id', filtros.proveedor_id);
    }

    if (filtros.busqueda) {
      params = params.set('busqueda', filtros.busqueda);
    }

    if (filtros.bajo_stock === true) {
      params = params.set('bajo_stock', 'true');
    }

    if (filtros.incluir_desactivados === true) {
      params = params.set('incluir_desactivados', 'true');
    }

    return this.http.get<any>(this.apiUrl, { params, observe: 'body' }).pipe(
      map(response => {
        const data = response?.data;
        if (!data) {
          // Si no hay data (posible 304), devolver el último listado conocido
          return this.ultimoListado ?? { items: [], paginacion: { pagina, limite, total: 0, totalPaginas: 0 } };
        }
        this.ultimoListado = data;
        return data;
      })
    );
  }

  /**
   * Obtener item por ID
   */
  obtener(id: number): Observable<ItemInventario> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response?.data ?? null)
    );
  }

  /**
   * Crear item
   */
  crear(itemData: Partial<ItemInventario>): Observable<ItemInventario> {
    return this.http.post<any>(this.apiUrl, itemData).pipe(
      map(response => response?.data ?? null)
    );
  }

  /**
   * Actualizar item
   */
  actualizar(id: number, itemData: Partial<ItemInventario>): Observable<ItemInventario> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, itemData).pipe(
      map(response => response?.data ?? null)
    );
  }

  /**
   * Desactivar item
   */
  desactivar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Registrar entrada de stock
   */
  registrarEntrada(id: number, cantidad: number, motivo: string, referenciaId?: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/entrada`, {
      cantidad,
      motivo,
      referencia_id: referenciaId
    }).pipe(
      map(response => response?.data ?? null)
    );
  }

  /**
   * Registrar salida de stock
   */
  registrarSalida(id: number, cantidad: number, motivo: string, referenciaId?: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/salida`, {
      cantidad,
      motivo,
      referencia_id: referenciaId
    }).pipe(
      map(response => response?.data ?? null)
    );
  }

  /**
   * Ajustar stock
   */
  ajustarStock(id: number, nuevoStock: number, motivo: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/ajustar`, {
      nuevo_stock: nuevoStock,
      motivo
    }).pipe(
      map(response => response?.data ?? null)
    );
  }

  /**
   * Obtener movimientos de un item
   */
  obtenerMovimientos(id: number, limite: number = 20): Observable<Movimiento[]> {
    const params = new HttpParams().set('limite', limite.toString());
    return this.http.get<any>(`${this.apiUrl}/${id}/movimientos`, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtener categorías
   */
  obtenerCategorias(): Observable<Categoria[]> {
    return this.http.get<any>(`${this.apiUrl}/categorias`, { observe: 'body' }).pipe(
      map(response => {
        const data = response?.data ?? null;
        if (!data && this.cacheCategorias) return this.cacheCategorias;
        if (data) this.cacheCategorias = data;
        return data ?? [];
      })
    );
  }

  /**
   * Obtener proveedores
   */
  obtenerProveedores(): Observable<Proveedor[]> {
    return this.http.get<any>(`${this.apiUrl}/proveedores`, { observe: 'body' }).pipe(
      map(response => {
        const data = response?.data ?? null;
        if (!data && this.cacheProveedores) return this.cacheProveedores;
        if (data) this.cacheProveedores = data;
        return data ?? [];
      })
    );
  }

  /**
   * Obtener items con bajo stock
   */
  obtenerBajoStock(): Observable<ItemInventario[]> {
    return this.http.get<any>(`${this.apiUrl}/stock-bajo`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtener estadísticas
   */
  obtenerEstadisticas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Buscar items
   */
  buscar(termino: string, limite: number = 10): Observable<ItemInventario[]> {
    const params = new HttpParams()
      .set('termino', termino)
      .set('limite', limite.toString());

    return this.http.get<any>(`${this.apiUrl}/buscar`, { params }).pipe(
      map(response => response.data)
    );
  }

  descargarReportePDF(filtros: any = {}): void {
    let params = new HttpParams();
    Object.keys(filtros).forEach(key => {
      if (filtros[key]) params = params.append(key, filtros[key]);
    });
    
    this.http.get(`${this.apiUrl}/reporte-pdf`, { 
      params, 
      responseType: 'blob',
      observe: 'response'
    }).subscribe({
      next: (response) => {
        const blob = response.body;
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `reporte-inventario-${new Date().getTime()}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        }
      },
      error: (error) => {
        console.error('Error al descargar PDF:', error);
        alert('Error al generar el reporte PDF');
      }
    });
  }

  /**
   * Generar código QR para un ítem
   */
  generarQR(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/generar-qr`, {});
  }

  /**
   * Descargar código QR de un ítem
   */
  descargarQR(id: number, nombreItem: string): void {
    this.http.get(`${this.apiUrl}/${id}/descargar-qr`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `QR_${nombreItem.replace(/\s+/g, '_')}_${id}.png`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error al descargar QR:', error);
        alert('Error al descargar el código QR');
      }
    });
  }

  /**
   * Generar códigos QR masivos
   */
  generarQRMasivo(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/generar-qr-masivo`, {});
  }
}
