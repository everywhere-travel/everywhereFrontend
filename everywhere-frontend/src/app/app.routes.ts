import type { Routes } from "@angular/router"
import { AuthGuard } from "./guards/auth.guard"

export const routes: Routes = [
  {
    path: "",
    redirectTo: "/login",
    pathMatch: "full",
  },
  {
    path: "login",
    loadComponent: () => import("./components/login/login.component").then((m) => m.LoginComponent),
  },
  {
    path: "dashboard",
    loadComponent: () => import("./components/dashboard/dashboard.component").then((m) => m.DashboardComponent),
    canActivate: [AuthGuard],
  },
  {
    path: "personas",
    loadComponent: () => import("./components/personas/personas.component").then((m) => m.PersonasComponent),
    canActivate: [AuthGuard],
  },
  {
    path: "cotizaciones",
    loadComponent: () =>
      import("./components/cotizaciones/cotizaciones.component").then((m) => m.CotizacionesComponent),
    canActivate: [AuthGuard],
  },
  {
    path: "cotizaciones/:id",
    loadComponent: () =>
      import("./components/cotizaciones/cotizacion-detail/cotizacion-detail.component").then(
        (m) => m.CotizacionDetailComponent,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: "liquidaciones",
    loadComponent: () =>
      import("./components/liquidaciones/liquidaciones.component").then((m) => m.LiquidacionesComponent),
    canActivate: [AuthGuard],
  },
  {
    path: "productos",
    loadComponent: () => import("./components/productos/productos.component").then((m) => m.ProductosComponent),
    canActivate: [AuthGuard],
  },
  {
    path: "reportes",
    loadComponent: () => import("./components/reportes/reportes.component").then((m) => m.ReportesComponent),
    canActivate: [AuthGuard],
  },
  {
    path: "**",
    redirectTo: "/login",
  },
]
