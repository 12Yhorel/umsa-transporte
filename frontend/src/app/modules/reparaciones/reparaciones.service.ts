import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Reparacion {
  id: number;
  vehiculo_id: number;
  tecnico_id: number;
  fecha_recepcion: string;
  fecha_estimada_entrega?: string;
  fecha_real_entrega?: string;
  descripcion_problema: string;
  diagnostico?: string;
  estado: 'RECIBIDO' | 'DIAGNOSTICO' | 'EN_REPARACION' | 'TERMINADO' | 'ENTREGADO';
  costo_total: number;
  creado_en?: string;
  // Campos de relaciones
  placa?: string;
  marca?: string;
  modelo?: string;
  tecnico_nombre?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReparacionesService {
  private apiUrl = `${environment.apiUrl}/api/reparaciones`;
  private ultimoListado: any = null;

  constructor(private http: HttpClient) {}

  listar(pagina: number = 1, limite: number = 20, filtros?: any): Observable<any> {
    let params: any = { pagina: pagina.toString(), limite: limite.toString() };
    if (filtros?.estado) params.estado = filtros.estado;
    if (filtros?.tipo) params.tipo = filtros.tipo;
    if (filtros?.vehiculo_id) params.vehiculo_id = filtros.vehiculo_id;

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => {
        const data = response?.data ?? null;
        if (!data) return this.ultimoListado ?? { reparaciones: [], paginacion: { pagina: 1, limite, total: 0, totalPaginas: 0 } };
        this.ultimoListado = data;
        return data;
      })
    );
  }

  obtenerPorId(id: number): Observable<Reparacion> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
  }

  crear(reparacion: Partial<Reparacion>): Observable<Reparacion> {
    return this.http.post<any>(this.apiUrl, reparacion).pipe(map(r => r.data));
  }

  actualizar(id: number, reparacion: Partial<Reparacion>): Observable<Reparacion> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, reparacion).pipe(map(r => r.data));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(map(() => undefined));
  }

  cambiarEstado(id: number, nuevoEstado: string, payload?: any): Observable<any> {
    const body = payload || { estado: nuevoEstado };
    return this.http.patch(`${this.apiUrl}/${id}/estado`, body);
  }

  obtenerRepuestos(id: number): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/${id}/repuestos`).pipe(
      map(r => r.data || [])
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
          link.download = `reporte-reparaciones-${new Date().getTime()}.pdf`;
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
}
