import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth/auth.guard';
import { authInverseGuard } from './core/guards/auth/auth-inverse.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./pages/auth/auth.routes').then(a => a.authRoutes),
    canActivate: [authInverseGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'personas',
    loadComponent: () =>
      import('./pages/personas/personas.component').then(m => m.PersonasComponent),
    canActivate: [authGuard]
  },
  {
    path: 'viajero',
    loadComponent: () =>
      import('./pages/viajero/viajero').then(m => m.Viajero),
    canActivate: [authGuard]
  },
  {
    path: 'viajero-frecuente',
    loadComponent: () =>
      import('./pages/viajero-frecuente/viajero-frecuente').then(m => m.ViajeroFrecuente),
    canActivate: [authGuard]
  },
  {
    path: 'cotizaciones',
    loadComponent: () =>
      import('./pages/cotizaciones/cotizaciones.component').then(m => m.CotizacionesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'cotizaciones/detail',
    loadComponent: () =>
      import('./pages/cotizaciones/cotizacion-detail/cotizacion-detail.component').then(m => m.CotizacionDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'cotizaciones/detail/:id',
    loadComponent: () =>
      import('./pages/cotizaciones/cotizacion-detail/cotizacion-detail.component').then(m => m.CotizacionDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'liquidaciones',
    loadComponent: () =>
      import('./pages/liquidaciones/liquidaciones.component').then(m => m.LiquidacionesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'productos',
    loadComponent: () =>
      import('./pages/productos/productos.component').then(m => m.ProductosComponent),
    canActivate: [authGuard]
  },
  {
    path: 'reportes',
    loadComponent: () =>
      import('./pages/reportes/reportes.component').then(m => m.ReportesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'estadisticas',
    loadComponent: () =>
      import('./pages/estadistica/estadistica.component').then(m => m.EstadisticaComponent),
    canActivate: [authGuard]
  },
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/auth/login' }
];
