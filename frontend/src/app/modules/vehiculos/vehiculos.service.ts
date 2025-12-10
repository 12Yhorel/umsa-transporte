import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Vehiculo {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  anio?: number;
  color?: string;
  capacidad: number;
  tipo_combustible: 'GASOLINA' | 'DIESEL' | 'GAS' | 'ELECTRICO' | 'HIBRIDO';
  estado: 'DISPONIBLE' | 'EN_USO' | 'EN_MANTENIMIENTO' | 'FUERA_DE_SERVICIO';
  kilometraje_actual: number;
  fecha_ultima_revision?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VehiculosService {
  private apiUrl = `${environment.apiUrl}/api/vehiculos`;
  private ultimoListado: any = null;

  constructor(private http: HttpClient) {}

  listar(pagina: number = 1, limite: number = 20, filtros?: any): Observable<any> {
    let params: any = { pagina: pagina.toString(), limite: limite.toString() };
    
    if (filtros?.estado) params.estado = filtros.estado;
    if (filtros?.tipo_combustible) params.tipo_combustible = filtros.tipo_combustible;
    if (filtros?.busqueda) params.busqueda = filtros.busqueda;

    return this.http.get<ApiResponse>(this.apiUrl, { params }).pipe(
      map(response => {
        const data = response?.data ?? null;
        if (!data) return this.ultimoListado ?? { vehiculos: [], paginacion: { pagina: 1, limite, total: 0, totalPaginas: 0 } };
        this.ultimoListado = data;
        return data;
      })
    );
  }

  obtenerPorId(id: number): Observable<Vehiculo> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  crear(vehiculo: Partial<Vehiculo>): Observable<Vehiculo> {
    return this.http.post<ApiResponse>(this.apiUrl, vehiculo).pipe(
      map(response => response.data)
    );
  }

  actualizar(id: number, vehiculo: Partial<Vehiculo>): Observable<Vehiculo> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/${id}`, vehiculo).pipe(
      map(response => response.data)
    );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`).pipe(
      map(() => undefined)
    );
  }

  cambiarEstado(id: number, estado: string): Observable<Vehiculo> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/${id}/estado`, { estado }).pipe(
      map(response => response.data)
    );
  }

  obtenerEstadisticas(): Observable<any> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/estadisticas`).pipe(
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
          link.download = `reporte-vehiculos-${new Date().getTime()}.pdf`;
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
