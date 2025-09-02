import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PersonasComponent } from './components/personas/personas.component';
import { CotizacionesComponent } from './components/cotizaciones/cotizaciones.component';
import { CotizacionDetailComponent } from './components/cotizaciones/cotizacion-detail/cotizacion-detail.component';
import { LiquidacionesComponent } from './components/liquidaciones/liquidaciones.component';
import { ProductosComponent } from './components/productos/productos.component';
import { ReportesComponent } from './components/reportes/reportes.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' }, // Página por defecto
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent }, // Nueva ruta para el dashboard
  { path: 'personas', component: PersonasComponent }, // Nueva ruta para personas
  { path: 'cotizaciones', component: CotizacionesComponent },
  { path: 'cotizaciones/detail', component: CotizacionDetailComponent }, // Nueva ruta para cotización
  { path: 'liquidacion', component: LiquidacionesComponent }, // Nueva ruta para liquidación
  { path: 'productos', component: ProductosComponent }, // Nueva ruta para productos
  { path: 'reportes', component: ReportesComponent }, // Nueva ruta para reportes
];
