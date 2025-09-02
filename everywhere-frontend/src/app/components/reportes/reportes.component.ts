import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { type FormBuilder, type FormGroup, ReactiveFormsModule } from "@angular/forms"
import { NavbarComponent } from "../shared/navbar/navbar.component"
import type {
  ReportesService,
  FiltrosReporte,
  ReporteCotizaciones,
  ReporteLiquidaciones,
  AnalisisRentabilidad,
  TendenciasVentas,
} from "../../services/reportes.service"

@Component({
  selector: "app-reportes",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: "./reportes.component.html",
  styleUrls: ["./reportes.component.css"],
})
export class ReportesComponent implements OnInit {
  filtrosForm: FormGroup
  tipoReporte: "cotizaciones" | "liquidaciones" | "rentabilidad" | "tendencias" = "cotizaciones"

  cotizacionesData: ReporteCotizaciones[] = []
  liquidacionesData: ReporteLiquidaciones[] = []
  rentabilidadData: AnalisisRentabilidad[] = []
  tendenciasData: TendenciasVentas[] = []

  isLoading = false
  isExporting = false

  estadosDisponibles = ["Todos", "Pendiente", "En Proceso", "Aprobada", "Completada", "Cancelada"]
  monedasDisponibles = ["Todas", "USD", "EUR", "PEN", "COP"]

  constructor(
    private fb: FormBuilder,
    private reportesService: ReportesService,
  ) {
    this.filtrosForm = this.fb.group({
      fechaInicio: ["2024-01-01"],
      fechaFin: ["2024-12-31"],
      estado: ["Todos"],
      moneda: ["Todas"],
      cliente: [""],
      producto: [""],
    })
  }

  ngOnInit(): void {
    this.generarReporte()
  }

  cambiarTipoReporte(tipo: "cotizaciones" | "liquidaciones" | "rentabilidad" | "tendencias"): void {
    this.tipoReporte = tipo
    this.generarReporte()
  }

  generarReporte(): void {
    this.isLoading = true
    const filtros: FiltrosReporte = this.filtrosForm.value

    switch (this.tipoReporte) {
      case "cotizaciones":
        this.reportesService.getCotizacionesReporte(filtros).subscribe((data) => {
          this.cotizacionesData = data
          this.isLoading = false
        })
        break
      case "liquidaciones":
        this.reportesService.getLiquidacionesReporte(filtros).subscribe((data) => {
          this.liquidacionesData = data
          this.isLoading = false
        })
        break
      case "rentabilidad":
        this.reportesService.getAnalisisRentabilidad().subscribe((data) => {
          this.rentabilidadData = data
          this.isLoading = false
        })
        break
      case "tendencias":
        this.reportesService.getTendenciasVentas().subscribe((data) => {
          this.tendenciasData = data
          this.isLoading = false
        })
        break
    }
  }

  exportarReporte(formato: "pdf" | "excel"): void {
    this.isExporting = true
    const filtros: FiltrosReporte = this.filtrosForm.value

    this.reportesService
      .exportarReporte(this.tipoReporte as "cotizaciones" | "liquidaciones", formato, filtros)
      .subscribe((fileName) => {
        this.isExporting = false
        alert(`Reporte exportado: ${fileName}`)
      })
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("es-PE")
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`
  }

  getTotalCotizaciones(): number {
    return this.cotizacionesData.reduce((sum, item) => sum + item.total, 0)
  }

  getTotalComisiones(): number {
    return this.cotizacionesData.reduce((sum, item) => sum + item.comision, 0)
  }

  getTotalLiquidaciones(): number {
    return this.liquidacionesData.reduce((sum, item) => sum + item.total, 0)
  }

  getTotalPagado(): number {
    return this.liquidacionesData.reduce((sum, item) => sum + item.pagado, 0)
  }

  getTotalPendiente(): number {
    return this.liquidacionesData.reduce((sum, item) => sum + item.pendiente, 0)
  }
}
