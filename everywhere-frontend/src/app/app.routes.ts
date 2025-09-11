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
    path: 'viajero-frecuente',
    component: ViajeroFrecuente,
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
