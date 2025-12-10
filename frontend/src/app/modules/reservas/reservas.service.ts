import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Reserva {
  id: number;
  solicitante_id?: number;
  vehiculo_id: number;
  conductor_id?: number;
  fecha_solicitud?: string;
  fecha_reserva: string;
  hora_inicio: string;
  hora_fin: string;
  origen: string;
  destino: string;
  nombre_unidad: string;
  motivo: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA' | 'COMPLETADA';
  aprobado_por?: number;
  fecha_aprobacion?: string;
  observaciones?: string;
  vehiculo?: any;
  conductor?: any;
  solicitante?: any;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReservasService {
  private apiUrl = `${environment.apiUrl}/api/reservas`;
  private ultimoListado: any = null;

  constructor(private http: HttpClient) {}

  listar(pagina: number = 1, limite: number = 20, filtros?: any): Observable<any> {
    let params: any = { pagina: pagina.toString(), limite: limite.toString() };
    if (filtros?.estado) params.estado = filtros.estado;
    if (filtros?.vehiculo_id) params.vehiculo_id = filtros.vehiculo_id;
    if (filtros?.busqueda) params.busqueda = filtros.busqueda;

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => {
        const data = response?.data ?? null;
        if (!data) return this.ultimoListado ?? { reservas: [], paginacion: { pagina: 1, limite, total: 0, totalPaginas: 0 } };
        this.ultimoListado = data;
        return data;
      })
    );
  }

  obtenerPorId(id: number): Observable<Reserva> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map(r => r.data));
  }

  crear(reserva: Partial<Reserva>): Observable<Reserva> {
    return this.http.post<any>(this.apiUrl, reserva).pipe(map(r => r.data));
  }

  actualizar(id: number, reserva: Partial<Reserva>): Observable<Reserva> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, reserva).pipe(map(r => r.data));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(map(() => undefined));
  }

  cambiarEstado(id: number, estado: string, observaciones?: string): Observable<Reserva> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/estado`, { estado, observaciones }).pipe(map(r => r.data));
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
          link.download = `reporte-reservas-${new Date().getTime()}.pdf`;
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
