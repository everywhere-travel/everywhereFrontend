import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth/auth.guard';
import { authInverseGuard } from './core/guards/auth/auth-inverse.guard';
import { ProveedorComponent } from './pages/proveedor/proveedor.component';
import { OperadoresComponent } from './pages/operadores/operadores.component';
import { CategoriaPersonaComponent } from './pages/categoria-persona/categoria-persona.component';
import { EstadoCotizacionComponent } from './pages/estado-cotizacion/estado-cotizacion.component';

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
    path: 'personas/detalle/:id',
    loadComponent: () =>
      import('./pages/detalle-persona/detalle-persona.component').then(m => m.DetallePersonaComponent),
    canActivate: [authGuard]
  },
  {
    path: 'juridico/detalle/:id',
    loadComponent: () =>
      import('./pages/detalle-juridico/detalle-juridico.component').then(m => m.DetalleJuridicoComponent),
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
    path: 'sucursales',
    loadComponent: () =>
      import('./pages/sucursales/sucursales.component').then(m => m.SucursalesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'liquidaciones',
    loadComponent: () =>
      import('./pages/liquidaciones/liquidaciones.component').then(m => m.LiquidacionesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'liquidaciones/detalle/:id',
    loadComponent: () =>
      import('./pages/detalle-liquidacion/detalle-liquidacion.component').then(m => m.DetalleLiquidacionComponent),
    canActivate: [authGuard]
  },
  {
    path: 'productos',
    loadComponent: () =>
      import('./pages/productos/productos.component').then(m => m.ProductosComponent),
    canActivate: [authGuard]
  },
  {
    path: 'estado-cotizacion',
    component: EstadoCotizacionComponent,
    canActivate: [authGuard]
  },
  {
    path: 'formas-pago',
    loadComponent: () =>
      import('./pages/forma-pago/forma-pago.component').then(m => m.FormaPagoComponent),
    canActivate: [authGuard]
  },
  {
    path: 'categorias',
    loadComponent: () =>
      import('./pages/categorias/categorias.component').then(m => m.CategoriasComponent),
    canActivate: [authGuard]
  },
  {
    path: 'proveedores',
    component: ProveedorComponent,
    canActivate: [authGuard]
  },
  {
    path: 'categorias-persona',
    component: CategoriaPersonaComponent,
    canActivate: [authGuard]
  },
  {
    path: 'operadores',
    component: OperadoresComponent,
    canActivate: [authGuard]
  },
  {
    path: 'estadisticas',
    loadComponent: () =>
      import('./pages/estadistica/estadistica.component').then(m => m.EstadisticaComponent),
    canActivate: [authGuard]
  },
  {
    path: 'carpetas',
    loadComponent: () =>
      import('./pages/carpetas/carpetas.component').then(m => m.CarpetasComponent),
    canActivate: [authGuard]
  },
  {
    path: 'documentos',
    loadComponent: () =>
      import('./pages/documentos/documentos.component').then(m => m.DocumentosComponent),
    canActivate: [authGuard]
  },
  {
    path: 'documentos-cobranza',
    loadComponent: () =>
      import('./pages/documento-cobranza/documento-cobranza.component').then(m => m.DocumentoCobranzaComponent),
    canActivate: [authGuard]
  },
  {
    path: 'documentos-cobranza/detalle/:id',
    loadComponent: () =>
      import('./pages/detalle-documentoCobranza/detalle-documentoCobranza.component').then(m => m.DetalleDocumentoCobranzaComponent),
    canActivate: [authGuard]
  },
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/auth/login' }
];
