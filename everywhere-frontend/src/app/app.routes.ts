import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth/auth.guard';
import { authInverseGuard } from './core/guards/auth/auth-inverse.guard';
import { ModuleAccessGuard } from './core/guards/authorization.guard';
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
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'people',
    loadComponent: () =>
      import('./pages/personas/personas.component').then(m => m.PersonasComponent),
    canActivate: [authGuard]
  },
  {
    path: 'people/detalle/:id',
    loadComponent: () =>
      import('./pages/detalle-persona/detalle-persona.component').then(m => m.DetallePersonaComponent),
    canActivate: [authGuard]
  },
  {
    path: 'legal/detalle/:id',
    loadComponent: () =>
      import('./pages/detalle-juridico/detalle-juridico.component').then(m => m.DetalleJuridicoComponent),
    canActivate: [authGuard]
  },
  {
    path: 'quotes',
    loadComponent: () =>
      import('./pages/cotizaciones/cotizaciones.component').then(m => m.CotizacionesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'quotes/crear',
    loadComponent: () =>
      import('./pages/detalle-cotizacion/detalle-cotizacion.component').then(m => m.DetalleCotizacionComponent),
    canActivate: [authGuard]
  },
  {
    path: 'quotes/detalle/:id',
    loadComponent: () =>
      import('./pages/detalle-cotizacion/detalle-cotizacion.component').then(m => m.DetalleCotizacionComponent),
    canActivate: [authGuard]
  },
  {
    path: 'counters',
    loadComponent: () =>
      import('./pages/counters/counters.component').then(m => m.CountersComponent),
    canActivate: [authGuard]
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./pages/usuarios/usuarios.component').then(m => m.UsuariosComponent),
    canActivate: [authGuard, ModuleAccessGuard],
    data: { requiredModule: 'USUARIOS', requiredAction: 'READ' }
  },
  {
    path: 'branches',
    loadComponent: () =>
      import('./pages/sucursales/sucursales.component').then(m => m.SucursalesComponent),
    canActivate: [authGuard, ModuleAccessGuard],
    data: { requiredModule: 'SUCURSALES', requiredAction: 'READ' }
  },
  {
    path: 'settlements',
    loadComponent: () =>
      import('./pages/liquidaciones/liquidaciones.component').then(m => m.LiquidacionesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'settlements/detalle/:id',
    loadComponent: () =>
      import('./pages/detalle-liquidacion/detalle-liquidacion.component').then(m => m.DetalleLiquidacionComponent),
    canActivate: [authGuard]
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./pages/productos/productos.component').then(m => m.ProductosComponent),
    canActivate: [authGuard, ModuleAccessGuard],
    data: { requiredModule: 'PRODUCTOS', requiredAction: 'READ' }
  },
  {
    path: 'quote-status',
    component: EstadoCotizacionComponent,
    canActivate: [authGuard, ModuleAccessGuard],
    data: { requiredModule: 'ESTADO_COTIZACION', requiredAction: 'READ' }
  },
  {
    path: 'payment-methods',
    loadComponent: () =>
      import('./pages/forma-pago/forma-pago.component').then(m => m.FormaPagoComponent),
    canActivate: [authGuard, ModuleAccessGuard],
    data: { requiredModule: 'FORMA-PAGO', requiredAction: 'READ' }
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./pages/categorias/categorias.component').then(m => m.CategoriasComponent),
    canActivate: [authGuard, ModuleAccessGuard],
    data: { requiredModule: 'CATEGORIA_PRODUCTO', requiredAction: 'READ' }
  },
  {
    path: 'suppliers',
    component: ProveedorComponent,
    canActivate: [authGuard, ModuleAccessGuard],
    data: { requiredModule: 'PROVEEDORES', requiredAction: 'READ' }
  },
  {
    path: 'suppliers/detalle/:id',
    loadComponent: () =>
      import('./pages/detalle-proveedor/detalle-proveedor.component').then(m => m.DetalleProveedorComponent),
    canActivate: [authGuard, ModuleAccessGuard],
    data: { requiredModule: 'PROVEEDORES', requiredAction: 'READ' }
  },
  {
    path: 'people-categories',
    component: CategoriaPersonaComponent,
    canActivate: [authGuard, ModuleAccessGuard],
    data: { requiredModule: 'CATEGORIA_CLIENTE', requiredAction: 'READ' }
  },
  {
    path: 'operators',
    component: OperadoresComponent,
    canActivate: [authGuard, ModuleAccessGuard],
    data: { requiredModule: 'OPERADOR', requiredAction: 'READ' }
  },
  {
    path: 'statistics',
    loadComponent: () =>
      import('./pages/estadistica/estadistica.component').then(m => m.EstadisticaComponent),
    canActivate: [authGuard]
  },
  {
    path: 'folders',
    loadComponent: () =>
      import('./pages/carpetas/carpetas.component').then(m => m.CarpetasComponent),
    canActivate: [authGuard]
  },
  {
    path: 'documents',
    loadComponent: () =>
      import('./pages/documentos/documentos.component').then(m => m.DocumentosComponent),
    canActivate: [authGuard]
  },
  {
    path: 'collection-documents',
    loadComponent: () =>
      import('./pages/documento-cobranza/documento-cobranza.component').then(m => m.DocumentoCobranzaComponent),
    canActivate: [authGuard]
  },
  {
    path: 'collection-documents/detalle/:id',
    loadComponent: () =>
      import('./pages/detalle-documentoCobranza/detalle-documentoCobranza.component').then(m => m.DetalleDocumentoCobranzaComponent),
    canActivate: [authGuard]
  },
  {
    path: 'receipts',
    loadComponent: () =>
      import('./pages/recibo/recibo.component').then(m => m.ReciboComponent),
    canActivate: [authGuard]
  },
  {
    path: 'receipts/detalle/:id',
    loadComponent: () =>
      import('./pages/detalle-recibo/detalle-recibo.component').then(m => m.DetalleReciboComponent),
    canActivate: [authGuard]
  },
  {
    path: 'roles',
    loadComponent: () =>
      import('./pages/roles/roles.component').then(m => m.RolesComponent),
    canActivate: [authGuard, ModuleAccessGuard],
    data: { requiredModule: 'ROLES', requiredAction: 'READ' }
  },
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/auth/login' }
];
