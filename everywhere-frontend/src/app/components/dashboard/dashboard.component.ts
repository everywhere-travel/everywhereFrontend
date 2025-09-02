import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { NavbarComponent } from "../shared/navbar/navbar.component"
import type {
  EstadisticasService,
  EstadisticasGenerales,
  VentasPorMes,
  EstadoCotizaciones,
  TopProductos,
} from "../../services/estadisticas.service"

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
})
export class DashboardComponent implements OnInit {
  estadisticasGenerales: EstadisticasGenerales | null = null
  ventasPorMes: VentasPorMes[] = []
  estadoCotizaciones: EstadoCotizaciones[] = []
  topProductos: TopProductos[] = []
  ingresosPorMoneda: { moneda: string; monto: number }[] = []
  isLoading = true

  quickActions = [
    {
      title: "Gestión de Personas",
      description: "Administra personas naturales, jurídicas y viajeros",
      icon: "👥",
      route: "/personas",
      color: "primary",
    },
    {
      title: "Cotizaciones",
      description: "Crea y gestiona cotizaciones de paquetes turísticos",
      icon: "📋",
      route: "/cotizaciones",
      color: "secondary",
    },
    {
      title: "Liquidaciones",
      description: "Procesa liquidaciones y facturación",
      icon: "💰",
      route: "/liquidaciones",
      color: "accent",
    },
    {
      title: "Productos",
      description: "Gestiona productos y servicios turísticos",
      icon: "🏨",
      route: "/productos",
      color: "success",
    },
  ]

  constructor(private estadisticasService: EstadisticasService) {}

  ngOnInit(): void {
    this.loadDashboardData()
    setInterval(() => {
      this.loadDashboardData()
    }, 30000)
  }

  private loadDashboardData(): void {
    this.isLoading = true

    // Load all statistics data
    this.estadisticasService.getEstadisticasGenerales().subscribe((data) => {
      this.estadisticasGenerales = data
    })

    this.estadisticasService.getVentasPorMes().subscribe((data) => {
      this.ventasPorMes = data
    })

    this.estadisticasService.getEstadoCotizaciones().subscribe((data) => {
      this.estadoCotizaciones = data
    })

    this.estadisticasService.getTopProductos().subscribe((data) => {
      this.topProductos = data
    })

    this.estadisticasService.getIngresosPorMoneda().subscribe((data) => {
      this.ingresosPorMoneda = data
      this.isLoading = false
    })
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat("es-PE").format(num)
  }

  refreshData(): void {
    this.loadDashboardData()
  }

  getStatusColor(estado: string): string {
    const colors: { [key: string]: string } = {
      Pendiente: "#f59e0b",
      "En Proceso": "#3b82f6",
      Aprobada: "#10b981",
      Completada: "#6b7280",
    }
    return colors[estado] || "#6b7280"
  }
}
