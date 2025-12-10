import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadComponent: () => import('./modules/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: 'restablecer-password',
    loadComponent: () => import('./modules/auth/restablecer-password.component').then(m => m.RestablecerPasswordComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./modules/usuarios/usuarios.component').then(m => m.UsuariosComponent),
    canActivate: [authGuard]
  },
  {
    path: 'vehiculos',
    loadComponent: () => import('./modules/vehiculos/vehiculos.component').then(m => m.VehiculosComponent),
    canActivate: [authGuard]
  },
  {
    path: 'conductores',
    loadComponent: () => import('./modules/conductores/conductores.component').then(m => m.ConductoresComponent),
    canActivate: [authGuard]
  },
  {
    path: 'reservas',
    loadComponent: () => import('./modules/reservas/reservas.component').then(m => m.ReservasComponent),
    canActivate: [authGuard]
  },
  {
    path: 'inventario',
    loadComponent: () => import('./modules/inventario/inventario.component').then(m => m.InventarioComponent),
    canActivate: [authGuard]
  },
  {
    path: 'reparaciones',
    loadComponent: () => import('./modules/reparaciones/reparaciones.component').then(m => m.ReparacionesComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
