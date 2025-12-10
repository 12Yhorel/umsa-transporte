import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-form">
        <h1>🚌 Sistema de Transporte UMSA</h1>
        <h2>{{ esRegistro ? 'Crear Cuenta' : 'Iniciar Sesión' }}</h2>
        
        <!-- FORMULARIO DE LOGIN -->
        <form *ngIf="!esRegistro && !esRecuperacion" [formGroup]="loginForm" (ngSubmit)="onLogin()">
          <div class="form-group">
            <label>Email:</label>
            <input type="email" formControlName="email" class="form-control" />
          </div>
          
          <div class="form-group">
            <label>Contraseña:</label>
            <input type="password" formControlName="password" class="form-control" />
          </div>
          
          <button type="submit" [disabled]="!loginForm.valid" class="btn btn-primary">
            Iniciar Sesión
          </button>

          <div class="toggle-form">
            <p><a (click)="mostrarRecuperacion()" class="link">¿Olvidaste tu contraseña?</a></p>
            <p>¿No tienes cuenta? <a (click)="toggleFormulario()" class="link">Regístrate aquí</a></p>
          </div>
        </form>

        <!-- FORMULARIO DE REGISTRO -->
        <form *ngIf="esRegistro" [formGroup]="registroForm" (ngSubmit)="onRegistro()">
          <div class="form-group">
            <label>Nombres: *</label>
            <input type="text" formControlName="nombres" class="form-control" placeholder="Juan" />
          </div>

          <div class="form-group">
            <label>Apellidos: *</label>
            <input type="text" formControlName="apellidos" class="form-control" placeholder="Pérez" />
          </div>
          
          <div class="form-group">
            <label>Email: *</label>
            <input type="email" formControlName="email" class="form-control" placeholder="ejemplo@umsa.bo" />
          </div>

          <div class="form-group">
            <label>Teléfono:</label>
            <input type="text" formControlName="telefono" class="form-control" placeholder="70000000" />
          </div>

          <div class="form-group">
            <label>Departamento:</label>
            <input type="text" formControlName="departamento" class="form-control" placeholder="Ingeniería" />
          </div>
          
          <div class="form-group">
            <label>Contraseña: *</label>
            <input type="password" formControlName="password" class="form-control" placeholder="Mínimo 6 caracteres" />
          </div>

          <div class="form-group">
            <label>Confirmar Contraseña: *</label>
            <input type="password" formControlName="confirmPassword" class="form-control" />
          </div>

          <div *ngIf="registroForm.errors?.['passwordMismatch'] && registroForm.get('confirmPassword')?.touched" 
               class="alert alert-warning">
            Las contraseñas no coinciden
          </div>
          
          <button type="submit" [disabled]="!registroForm.valid" class="btn btn-primary">
            Crear Cuenta
          </button>
          
          <div class="toggle-form">
            <p>¿Ya tienes cuenta? <a (click)="toggleFormulario()" class="link">Inicia sesión aquí</a></p>
          </div>
        </form>

        <!-- FORMULARIO DE RECUPERACIÓN DE CONTRASEÑA -->
        <form *ngIf="esRecuperacion" [formGroup]="recuperacionForm" (ngSubmit)="onRecuperacion()">
          <div class="form-group">
            <label>Email:</label>
            <input type="email" formControlName="email" class="form-control" placeholder="Ingresa tu email" />
          </div>

          <p class="info-text">
            Te enviaremos un enlace para restablecer tu contraseña
          </p>
          
          <button type="submit" [disabled]="!recuperacionForm.valid" class="btn btn-primary">
            Enviar Enlace de Recuperación
          </button>
          
          <div class="toggle-form">
            <p><a (click)="volverLogin()" class="link">← Volver al login</a></p>
          </div>
        </form>

        <div *ngIf="error" class="alert alert-danger">
          {{ error }}
        </div>

        <div *ngIf="success" class="alert alert-success">
          {{ success }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .auth-form {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 400px;
    }
    
    h1, h2 { text-align: center; }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
    }
    
    .form-control {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .btn {
      width: 100%;
      padding: 10px;
      background-color: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
      margin-top: 10px;
    }
    
    .btn:hover:not(:disabled) {
      background-color: #764ba2;
    }
    
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .alert {
      margin-top: 15px;
      padding: 10px;
      border-radius: 4px;
    }
    
    .alert-danger {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .alert-success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .alert-warning {
      background-color: #fff3cd;
      color: #856404;
      border: 1px solid #ffeaa7;
    }

    .toggle-form {
      margin-top: 20px;
      text-align: center;
    }

    .toggle-form p {
      margin: 0;
      color: #666;
    }

    .link {
      color: #667eea;
      cursor: pointer;
      text-decoration: underline;
    }

    .link:hover {
      color: #764ba2;
    }

    .info-text {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin: 10px 0;
    }
  `]
})
export class AuthComponent {
  loginForm: FormGroup;
  registroForm: FormGroup;
  recuperacionForm: FormGroup;
  error: string = '';
  success: string = '';
  esRegistro: boolean = false;
  esRecuperacion: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.registroForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      departamento: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });

    this.recuperacionForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  toggleFormulario(): void {
    this.esRegistro = !this.esRegistro;
    this.esRecuperacion = false;
    this.error = '';
    this.success = '';
    this.loginForm.reset();
    this.registroForm.reset();
  }

  mostrarRecuperacion(): void {
    this.esRecuperacion = true;
    this.esRegistro = false;
    this.error = '';
    this.success = '';
    this.recuperacionForm.reset();
  }

  volverLogin(): void {
    this.esRecuperacion = false;
    this.esRegistro = false;
    this.error = '';
    this.success = '';
    this.loginForm.reset();
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      this.error = '';
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/dashboard']);
          } else {
            this.error = response.message || 'Error al iniciar sesión';
          }
        },
        error: (err) => {
          console.error('Error de login:', err);
          if (err.status === 401) {
            this.error = 'Credenciales inválidas';
          } else if (err.status === 0) {
            this.error = 'No se puede conectar con el servidor. Verifica que el backend esté ejecutándose en http://localhost:3001';
          } else if (err.error?.message) {
            this.error = err.error.message;
          } else {
            this.error = 'Error al iniciar sesión: ' + (err.statusText || 'Error desconocido');
          }
        }
      });
    }
  }

  onRegistro(): void {
    if (this.registroForm.valid) {
      this.error = '';
      this.success = '';
      
      const datosRegistro = {
        nombres: this.registroForm.value.nombres,
        apellidos: this.registroForm.value.apellidos,
        email: this.registroForm.value.email,
        telefono: this.registroForm.value.telefono,
        departamento: this.registroForm.value.departamento,
        password: this.registroForm.value.password
      };

      this.authService.registro(datosRegistro).subscribe({
        next: (response) => {
          if (response.success) {
            this.success = 'Cuenta creada exitosamente. Redirigiendo...';
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 1500);
          } else {
            this.error = response.message || 'Error al crear la cuenta';
          }
        },
        error: (err) => {
          console.error('Error de registro:', err);
          if (err.status === 409) {
            this.error = 'El email ya está registrado';
          } else if (err.status === 0) {
            this.error = 'No se puede conectar con el servidor';
          } else if (err.error?.message) {
            this.error = err.error.message;
          } else {
            this.error = 'Error al crear la cuenta: ' + (err.statusText || 'Error desconocido');
          }
        }
      });
    }
  }

  onRecuperacion(): void {
    if (this.recuperacionForm.valid) {
      this.error = '';
      this.success = '';
      
      const email = this.recuperacionForm.value.email;

      this.authService.recuperarPassword(email).subscribe({
        next: (response) => {
          if (response.success) {
            this.success = response.message || 'Se ha enviado un enlace de recuperación a tu email';
            
            // En desarrollo, mostrar el token en consola
            if (response.data?.token) {
              console.log('Token de recuperación:', response.data.token);
              console.log('URL:', response.data.url);
            }
          } else {
            this.error = response.message || 'Error al solicitar recuperación';
          }
        },
        error: (err) => {
          console.error('Error de recuperación:', err);
          if (err.status === 0) {
            this.error = 'No se puede conectar con el servidor';
          } else if (err.error?.message) {
            this.error = err.error.message;
          } else {
            this.error = 'Error al solicitar recuperación';
          }
        }
      });
    }
  }
}
