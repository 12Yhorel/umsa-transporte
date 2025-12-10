import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';

export interface Usuario {
  id: number;
  email: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  departamento?: string;
  rol_id?: number;
  rol_nombre?: string;
  activo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/api/usuarios`;
  private ultimoListado: { usuarios: Usuario[]; paginacion: any } | null = null;

  listar(pagina = 1, limite = 50, filtros: any = {}): Observable<{ usuarios: Usuario[]; paginacion: any }> {
    let params = new HttpParams()
      .set('pagina', String(pagina))
      .set('limite', String(limite));

    // Agregar filtros si existen
    if (filtros.activo !== undefined && filtros.activo !== '') {
      params = params.set('activo', filtros.activo);
    }
    if (filtros.rol_id) {
      params = params.set('rol_id', filtros.rol_id);
    }
    if (filtros.busqueda) {
      params = params.set('busqueda', filtros.busqueda);
    }

    return this.http
      .get<any>(`${this.api}`, { params, observe: 'body' })
      .pipe(
        map(r => {
          // Estructura esperada: { success, data: { usuarios: [], paginacion: {} } }
          const data = r?.data ?? null;
          if (!data) {
            // Respuesta 304 sin body: devolver último listado conocido
            return this.ultimoListado ?? { usuarios: [], paginacion: { pagina, limite, total: 0, totalPaginas: 0 } };
          }
          const result = {
            usuarios: data.usuarios || [],
            paginacion: data.paginacion || null
          };
          this.ultimoListado = result;
          return result;
        })
      );
  }

  obtener(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.api}/${id}`);
  }

  crear(payload: Partial<Usuario>): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.api}`, payload);
  }

  actualizar(id: number, payload: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.api}/${id}`, payload);
  }

  desactivar(id: number): Observable<any> {
    return this.http.put<any>(`${this.api}/${id}/desactivar`, {});
  }

  activar(id: number): Observable<any> {
    return this.http.put<any>(`${this.api}/${id}/activar`, {});
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.api}/${id}`);
  }

  buscar(termino: string, pagina = 1, limite = 50): Observable<{ usuarios: Usuario[]; paginacion: any }> {
    return this.http
      .get<any>(`${this.api}`, { params: { busqueda: termino, pagina: String(pagina), limite: String(limite) }, observe: 'body' })
      .pipe(
        map(r => {
          const data = r?.data ?? null;
          if (!data) {
            return this.ultimoListado ?? { usuarios: [], paginacion: { pagina, limite, total: 0, totalPaginas: 0 } };
          }
          const result = {
            usuarios: data.usuarios || [],
            paginacion: data.paginacion || null
          };
          this.ultimoListado = result;
          return result;
        })
      );
  }

  // Obtener roles para mostrar en formularios
  obtenerRoles(): Observable<any[]> {
    return this.http.get<any>(`${this.api}/roles`).pipe(map(r => r?.data || []));
  }

  descargarReportePDF(filtros: any = {}): void {
    let params = new HttpParams();
    Object.keys(filtros).forEach(key => {
      if (filtros[key] !== null && filtros[key] !== undefined && filtros[key] !== '') {
        params = params.append(key, filtros[key]);
      }
    });
    
    this.http.get(`${this.api}/reporte-pdf`, { 
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
          link.download = `reporte-usuarios-${new Date().getTime()}.pdf`;
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

export default UsuariosService;
