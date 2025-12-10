import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Conductor {
  id: number;
  usuario_id: number;
  licencia_numero: string;
  licencia_categoria: string;
  licencia_vencimiento: string;
  telefono?: string;
  habilitado: boolean;
  // Campos del JOIN con usuarios
  nombres?: string;
  apellidos?: string;
  email?: string;
  departamento?: string;
  telefono_usuario?: string;
  // Campos calculados
  dias_vencimiento_licencia?: number;
  licencia_proxima_vencer?: boolean;
  licencia_vencida?: boolean;
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
export class ConductoresService {
  private apiUrl = `${environment.apiUrl}/api/conductores`;
  private ultimoListado: any = null;

  constructor(private http: HttpClient) {}

  listar(pagina: number = 1, limite: number = 20, filtros?: any): Observable<any> {
    let params: any = { pagina: pagina.toString(), limite: limite.toString() };
    
    if (filtros?.estado) params.estado = filtros.estado;
    if (filtros?.busqueda) params.busqueda = filtros.busqueda;

    return this.http.get<ApiResponse>(this.apiUrl, { params }).pipe(
      map(response => {
        const data = response?.data ?? null;
        if (!data) return this.ultimoListado ?? { conductores: [], paginacion: { pagina: 1, limite, total: 0, totalPaginas: 0 } };
        this.ultimoListado = data;
        return data;
      })
    );
  }

  obtenerPorId(id: number): Observable<Conductor> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  crear(conductor: Partial<Conductor>): Observable<Conductor> {
    return this.http.post<ApiResponse>(this.apiUrl, conductor).pipe(
      map(response => response.data)
    );
  }

  actualizar(id: number, conductor: Partial<Conductor>): Observable<Conductor> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/${id}`, conductor).pipe(
      map(response => response.data)
    );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`).pipe(
      map(() => undefined)
    );
  }

  cambiarHabilitacion(id: number, habilitado: boolean): Observable<Conductor> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/${id}/habilitacion`, { habilitado }).pipe(
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
          link.download = `reporte-conductores-${new Date().getTime()}.pdf`;
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
