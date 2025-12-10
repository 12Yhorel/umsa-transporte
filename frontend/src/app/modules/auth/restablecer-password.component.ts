import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-restablecer-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-form">
        <h1>🚌 Sistema de Transporte UMSA</h1>
        <h2>Restablecer Contraseña</h2>
        
        <div *ngIf="!tokenValido && !cargando" class="alert alert-danger">
          El enlace de recuperación es inválido o ha expirado
        </div>

        <form *ngIf="tokenValido && !passwordCambiada" [formGroup]="restablecerForm" (ngSubmit)="onRestablecer()">
          <div class="form-group">
            <label>Email:</label>
            <input type="email" [value]="email" class="form-control" disabled />
          </div>

          <div class="form-group">
            <label>Nueva Contraseña: *</label>
            <input type="password" formControlName="password" class="form-control" placeholder="Mínimo 6 caracteres" />
          </div>

          <div class="form-group">
            <label>Confirmar Contraseña: *</label>
            <input type="password" formControlName="confirmPassword" class="form-control" />
          </div>

          <div *ngIf="restablecerForm.errors?.['passwordMismatch'] && restablecerForm.get('confirmPassword')?.touched" 
               class="alert alert-warning">
            Las contraseñas no coinciden
          </div>
          
          <button type="submit" [disabled]="!restablecerForm.valid || enviando" class="btn btn-primary">
            {{ enviando ? 'Restableciendo...' : 'Restablecer Contraseña' }}
          </button>
        </form>

        <div *ngIf="passwordCambiada" class="alert alert-success">
          <p><strong>¡Contraseña restablecida exitosamente!</strong></p>
          <p>Serás redirigido al login en unos segundos...</p>
        </div>

        <div *ngIf="error" class="alert alert-danger">
          {{ error }}
        </div>

        <div class="toggle-form">
          <p><a (click)="volverLogin()" class="link">← Volver al login</a></p>
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

    .form-control:disabled {
      background-color: #f5f5f5;
      color: #666;
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
  `]
})
export class RestablecerPasswordComponent implements OnInit {
  restablecerForm: FormGroup;
  token: string = '';
  email: string = '';
  error: string = '';
  tokenValido: boolean = false;
  passwordCambiada: boolean = false;
  enviando: boolean = false;
  cargando: boolean = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.restablecerForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Obtener token de la URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      
      if (this.token) {
        this.validarToken();
      } else {
        this.error = 'Token no proporcionado';
        this.cargando = false;
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  validarToken(): void {
    this.authService.validarTokenRecuperacion(this.token).subscribe({
      next: (response) => {
        if (response.success) {
          this.tokenValido = true;
          this.email = response.data.email;
        } else {
          this.error = response.message || 'Token inválido';
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al validar token:', err);
        this.error = err.error?.message || 'Token inválido o expirado';
        this.tokenValido = false;
        this.cargando = false;
      }
    });
  }

  onRestablecer(): void {
    if (this.restablecerForm.valid) {
      this.error = '';
      this.enviando = true;

      const nueva_password = this.restablecerForm.value.password;

      this.authService.restablecerPassword(this.token, nueva_password).subscribe({
        next: (response) => {
          if (response.success) {
            this.passwordCambiada = true;
            setTimeout(() => {
              this.router.navigate(['/auth']);
            }, 3000);
          } else {
            this.error = response.message || 'Error al restablecer la contraseña';
          }
          this.enviando = false;
        },
        error: (err) => {
          console.error('Error al restablecer contraseña:', err);
          this.error = err.error?.message || 'Error al restablecer la contraseña';
          this.enviando = false;
        }
      });
    }
  }

  volverLogin(): void {
    this.router.navigate(['/auth']);
  }
}
