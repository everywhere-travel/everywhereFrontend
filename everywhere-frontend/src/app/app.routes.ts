import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth/auth.guard';
import { authInverseGuard } from './core/guards/auth/auth-inverse.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PersonasComponent } from './pages/personas/personas.component';
import { Viajero } from './pages/viajero/viajero';
import { ViajeroFrecuente } from './pages/viajero-frecuente/viajero-frecuente';
import { CotizacionesComponent } from './pages/cotizaciones/cotizaciones.component';
import { CotizacionDetailComponent } from './pages/cotizaciones/cotizacion-detail/cotizacion-detail.component';
import { LiquidacionesComponent } from './pages/liquidaciones/liquidaciones.component';
import { ProductosComponent } from './pages/productos/productos.component';
import { ProveedorComponent } from './pages/proveedor/proveedor.component';
import { OperadoresComponent } from './pages/operadores/operadores.component';
import { ReportesComponent } from './pages/reportes/reportes.component';
import { EstadisticaComponent } from './pages/estadistica/estadistica.component';


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
    path: 'counters',
    loadComponent: () =>
      import('./pages/counters/counters.component').then(m => m.CountersComponent),
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
    path: 'proveedores',
    component: ProveedorComponent,
    canActivate: [authGuard]
  },
  {
    path: 'operadores',
    component: OperadoresComponent,
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
