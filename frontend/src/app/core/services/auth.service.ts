import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '@environments/environment';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    usuario: {
      id: number;
      nombres: string;
      apellidos: string;
      email: string;
      rol_id: number;
      departamento?: string;
      telefono?: string;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private usuarioActual$ = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {
    this.cargarUsuarioDelStorage();
  }

  login(credenciales: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credenciales).pipe(
      tap((response: AuthResponse) => {
        if (response.success && response.data?.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
          this.usuarioActual$.next(response.data.usuario);
        }
      })
    );
  }

  registrar(datos: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/registrar`, datos).pipe(
      tap((response: AuthResponse) => {
        if (response.success && response.data?.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
          this.usuarioActual$.next(response.data.usuario);
        }
      })
    );
  }

  registro(datos: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/registro`, datos).pipe(
      tap((response: AuthResponse) => {
        if (response.success && response.data?.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
          this.usuarioActual$.next(response.data.usuario);
        }
      })
    );
  }

  recuperarPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/recuperar-password`, { email });
  }

  validarTokenRecuperacion(token: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/validar-token/${token}`);
  }

  restablecerPassword(token: string, nueva_password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/restablecer-password`, { token, nueva_password });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.usuarioActual$.next(null);
  }

  obtenerToken(): string | null {
    return localStorage.getItem('token');
  }

  obtenerUsuario(): Observable<any> {
    return this.usuarioActual$.asObservable();
  }

  estaAutenticado(): boolean {
    return !!this.obtenerToken();
  }

  private cargarUsuarioDelStorage(): void {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      try {
        this.usuarioActual$.next(JSON.parse(usuario));
      } catch (error) {
        console.error('Error al cargar usuario del storage:', error);
      }
    }
  }
}
