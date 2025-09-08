import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth/auth.guard';
import { authInverseGuard } from './core/guards/auth/auth-inverse.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PersonasComponent } from './pages/personas/personas.component';
import { Viajero } from './pages/viajero/viajero';
import { CotizacionesComponent } from './pages/cotizaciones/cotizaciones.component';
import { CotizacionDetailComponent } from './pages/cotizaciones/cotizacion-detail/cotizacion-detail.component';
import { LiquidacionesComponent } from './pages/liquidaciones/liquidaciones.component';
import { ProductosComponent } from './pages/productos/productos.component';
import { ReportesComponent } from './pages/reportes/reportes.component';
import { EstadisticaComponent } from './pages/estadistica/estadistica.component';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import("./pages/auth/auth.routes").then(a => a.authRoutes),
    canActivate: [authInverseGuard]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'personas',
    component: PersonasComponent,
    canActivate: [authGuard]
  },
  {
    path: 'viajero',
    component: Viajero,
    canActivate: [authGuard]
  },
  {
    path: 'cotizaciones',
    component: CotizacionesComponent,
    canActivate: [authGuard]
  },
  {
    path: 'cotizaciones/detail',
    component: CotizacionDetailComponent,
    canActivate: [authGuard]
  },
  {
    path: 'cotizaciones/detail/:id',
    component: CotizacionDetailComponent,
    canActivate: [authGuard]
  },
  {
    path: 'liquidaciones',
    component: LiquidacionesComponent,
    canActivate: [authGuard]
  },
  {
    path: 'productos',
    component: ProductosComponent,
    canActivate: [authGuard]
  },
  {
    path: 'reportes',
    component: ReportesComponent,
    canActivate: [authGuard]
  },
  {
    path: 'estadisticas',
    component: EstadisticaComponent,
    canActivate: [authGuard]
  },
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/auth/login' }
];
