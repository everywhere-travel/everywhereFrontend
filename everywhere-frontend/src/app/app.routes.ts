import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth/auth.guard';
import { authInverseGuard } from './core/guards/auth/auth-inverse.guard';
import { ModuleAccessGuard, AdminGuard } from './core/guards/authorization.guard';
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
import { Module, Permission } from './shared/models/role.model';

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
    canActivate: [authGuard, ModuleAccessGuard],
    data: { 
      requiredModule: Module.PERSONAS,
      requiredPermission: Permission.READ 
    }
  },
  {
    path: 'viajero',
    component: Viajero,
    canActivate: [authGuard, ModuleAccessGuard],
    data: { 
      requiredModule: Module.VIAJEROS,
      requiredPermission: Permission.READ 
    }
  },
  {
    path: 'viajero-frecuente',
    component: ViajeroFrecuente,
    canActivate: [authGuard, ModuleAccessGuard],
    data: { 
      requiredModule: Module.VIAJEROS,
      requiredPermission: Permission.READ 
    }
  },
  {
    path: 'cotizaciones',
    component: CotizacionesComponent,
    canActivate: [authGuard, ModuleAccessGuard],
    data: { 
      requiredModule: Module.COTIZACIONES,
      requiredPermission: Permission.READ 
    }
  },
  {
    path: 'cotizaciones/detail',
    component: CotizacionDetailComponent,
    canActivate: [authGuard, ModuleAccessGuard],
    data: { 
      requiredModule: Module.COTIZACIONES,
      requiredPermission: Permission.READ 
    }
  },
  {
    path: 'cotizaciones/detail/:id',
    component: CotizacionDetailComponent,
    canActivate: [authGuard, ModuleAccessGuard],
    data: { 
      requiredModule: Module.COTIZACIONES,
      requiredPermission: Permission.READ 
    }
  },
  {
    path: 'liquidaciones',
    component: LiquidacionesComponent,
    canActivate: [authGuard, ModuleAccessGuard],
    data: { 
      requiredModule: Module.LIQUIDACIONES,
      requiredPermission: Permission.READ 
    }
  },
  {
    path: 'productos',
    component: ProductosComponent,
    canActivate: [authGuard, ModuleAccessGuard],
    data: { 
      requiredModule: Module.PRODUCTOS,
      requiredPermission: Permission.READ 
    }
  },
  {
    path: 'proveedores',
    component: ProveedorComponent,
    canActivate: [authGuard, ModuleAccessGuard],
    data: { 
      requiredModule: Module.PROVEEDORES,
      requiredPermission: Permission.READ 
    }
  },
  {
    path: 'operadores',
    component: OperadoresComponent,
    canActivate: [authGuard, ModuleAccessGuard],
    data: { 
      requiredModule: Module.SISTEMA,
      requiredPermission: Permission.READ 
    }
  },
  {
    path: 'reportes',
    component: ReportesComponent,
    canActivate: [authGuard, ModuleAccessGuard],
    data: { 
      requiredModule: Module.CONTABILIDAD,
      requiredPermission: Permission.READ 
    }
  },
  {
    path: 'estadisticas',
    component: EstadisticaComponent,
    canActivate: [authGuard, ModuleAccessGuard],
    data: { 
      requiredModule: Module.CONTABILIDAD,
      requiredPermission: Permission.READ 
    }
  },
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/auth/login' }
];
