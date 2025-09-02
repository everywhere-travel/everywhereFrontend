import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule, ReactiveFormsModule, type FormBuilder, type FormGroup, Validators } from "@angular/forms"
import type { LiquidacionService } from "../../services/liquidacion.service"
import type { CotizacionService } from "../../services/cotizacion.service"
import type { PersonaService } from "../../services/persona.service"
import type { ProductoService } from "../../services/producto.service"
import type { Liquidacion, DetalleLiquidacion } from "../models/liquidacion.model"
import type { Cotizacion } from "../../models/cotizacion.model"
import type { Viajero } from "../../models/persona.model"
import type { Operador, Proveedor } from "../../models/producto.model"

@Component({
  selector: "app-liquidaciones",
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: "./liquidaciones.component.html",
  styleUrls: ["./liquidaciones.component.css"],
})
export class LiquidacionesComponent implements OnInit {
  // UI State
  showForm = false
  editingId: number | null = null
  loading = false
  searchQuery = ""
  selectedCotizacion: Cotizacion | null = null

  // Forms
  liquidacionForm: FormGroup
  searchForm: FormGroup

  // Data
  liquidaciones: Liquidacion[] = []
  cotizaciones: Cotizacion[] = []
  viajeros: Viajero[] = []
  operadores: Operador[] = []
  proveedores: Proveedor[] = []

  // Liquidation Details
  detallesLiquidacion: DetalleLiquidacion[] = []

  // Configuration
  estados = [
    { value: "pendiente", label: "Pendiente" },
    { value: "procesada", label: "Procesada" },
    { value: "pagada", label: "Pagada" },
    { value: "cancelada", label: "Cancelada" },
  ]

  constructor(
    private liquidacionService: LiquidacionService,
    private cotizacionService: CotizacionService,
    private personaService: PersonaService,
    private productoService: ProductoService,
    private fb: FormBuilder,
  ) {
    this.liquidacionForm = this.createLiquidacionForm()
    this.searchForm = this.createSearchForm()
  }

  ngOnInit() {
    this.loadData()
  }

  private createLiquidacionForm(): FormGroup {
    return this.fb.group({
      cotizacionId: ["", Validators.required],
      numero: ["", Validators.required],
      fechaLiquidacion: [new Date().toISOString().split("T")[0], Validators.required],
      viajeroId: ["", Validators.required],
      operadorId: [""],
      proveedorId: [""],
      numeroTicket: [""],
      costoServicio: [0, [Validators.required, Validators.min(0)]],
      cargoServicio: [0, [Validators.min(0)]],
      valorVenta: [0, [Validators.required, Validators.min(0)]],
      numeroFactura: [""],
      numeroRecibo: [""],
      descuento: [0, [Validators.min(0)]],
      pagoSoles: [0, [Validators.min(0)]],
      pagoDolares: [0, [Validators.min(0)]],
      pagoEuros: [0, [Validators.min(0)]],
      observaciones: [""],
      cargoAdicional: [0, [Validators.min(0)]],
      estado: ["pendiente", Validators.required],
    })
  }

  private createSearchForm(): FormGroup {
    return this.fb.group({
      searchType: ["numero"],
      searchValue: [""],
    })
  }

  loadData() {
    this.loading = true

    // Load liquidaciones
    this.liquidacionService.getLiquidaciones().subscribe({
      next: (data) => (this.liquidaciones = data),
      error: (error) => console.error("Error loading liquidaciones:", error),
    })

    // Load cotizaciones
    this.cotizacionService.getCotizaciones().subscribe({
      next: (data) => (this.cotizaciones = data.filter((c) => c.estado === "aprobada")),
      error: (error) => console.error("Error loading cotizaciones:", error),
    })

    // Load viajeros
    this.personaService.getViajeros().subscribe({
      next: (data) => (this.viajeros = data),
      error: (error) => console.error("Error loading viajeros:", error),
    })

    // Load operadores
    this.productoService.getOperadores().subscribe({
      next: (data) => (this.operadores = data),
      error: (error) => console.error("Error loading operadores:", error),
    })

    // Load proveedores
    this.productoService.getProveedores().subscribe({
      next: (data) => {
        this.proveedores = data
        this.loading = false
      },
      error: (error) => {
        console.error("Error loading proveedores:", error)
        this.loading = false
      },
    })
  }

  toggleForm() {
    this.showForm = !this.showForm
    this.editingId = null
    this.selectedCotizacion = null
    if (this.showForm) {
      this.generateLiquidationNumber()
      this.resetForm()
    }
  }

  resetForm() {
    this.liquidacionForm.reset({
      numero: "",
      fechaLiquidacion: new Date().toISOString().split("T")[0],
      costoServicio: 0,
      cargoServicio: 0,
      valorVenta: 0,
      descuento: 0,
      pagoSoles: 0,
      pagoDolares: 0,
      pagoEuros: 0,
      cargoAdicional: 0,
      estado: "pendiente",
    })
    this.detallesLiquidacion = []
  }

  generateLiquidationNumber() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")

    const numero = `LIQ-${year}${month}${day}-${random}`
    this.liquidacionForm.patchValue({ numero })
  }

  onCotizacionChange() {
    const cotizacionId = this.liquidacionForm.get("cotizacionId")?.value
    if (cotizacionId) {
      this.selectedCotizacion = this.cotizaciones.find((c) => c.id === Number.parseInt(cotizacionId)) || null
      if (this.selectedCotizacion) {
        // Pre-fill form with quotation data
        this.liquidacionForm.patchValue({
          valorVenta: this.selectedCotizacion.total,
          costoServicio: this.selectedCotizacion.total * 0.8, // 80% of total as cost
        })

        // Load quotation details
        this.cotizacionService.getDetalleCotizacion(this.selectedCotizacion.id!).subscribe({
          next: (detalles) => {
            this.detallesLiquidacion = detalles.map((d) => ({
              id: undefined,
              liquidacionId: 0,
              productoId: d.productoId,
              cantidad: d.cantidad,
              precioUnitario: d.precioUnitario,
              subtotal: d.subtotal,
              descripcion: d.descripcion,
            }))
          },
          error: (error) => console.error("Error loading quotation details:", error),
        })
      }
    }
  }

  onSubmit() {
    if (this.liquidacionForm.valid) {
      const formData = this.liquidacionForm.value
      const liquidacion: Liquidacion = {
        ...formData,
        total: this.calculateTotal(),
      }

      if (this.editingId) {
        this.liquidacionService.updateLiquidacion(this.editingId, liquidacion).subscribe({
          next: () => {
            this.loadData()
            this.showForm = false
            this.editingId = null
          },
          error: (error) => console.error("Error updating liquidacion:", error),
        })
      } else {
        this.liquidacionService.createLiquidacion(liquidacion).subscribe({
          next: (newLiquidacion) => {
            // Save detail records
            this.saveDetailRecords(newLiquidacion.id!)
            this.loadData()
            this.showForm = false
          },
          error: (error) => console.error("Error creating liquidacion:", error),
        })
      }
    }
  }

  private saveDetailRecords(liquidacionId: number) {
    this.detallesLiquidacion.forEach((detalle) => {
      const detalleToSave: DetalleLiquidacion = {
        ...detalle,
        liquidacionId,
      }
      this.liquidacionService.addDetalleLiquidacion(detalleToSave).subscribe({
        error: (error) => console.error("Error saving detail record:", error),
      })
    })
  }

  editLiquidacion(liquidacion: Liquidacion) {
    this.editingId = liquidacion.id!
    this.showForm = true
    this.liquidacionForm.patchValue(liquidacion)

    // Load selected quotation
    this.selectedCotizacion = this.cotizaciones.find((c) => c.id === liquidacion.cotizacionId) || null

    // Load detail records
    this.liquidacionService.getDetalleLiquidacion(liquidacion.id!).subscribe({
      next: (detalles) => (this.detallesLiquidacion = detalles),
      error: (error) => console.error("Error loading liquidation details:", error),
    })
  }

  deleteLiquidacion(id: number) {
    if (confirm("¿Está seguro de eliminar esta liquidación?")) {
      this.liquidacionService.deleteLiquidacion(id).subscribe({
        next: () => this.loadData(),
        error: (error) => console.error("Error deleting liquidacion:", error),
      })
    }
  }

  searchLiquidaciones() {
    const searchData = this.searchForm.value
    if (searchData.searchValue.trim()) {
      this.liquidacionService.searchLiquidaciones(searchData.searchValue).subscribe({
        next: (results) => (this.liquidaciones = results),
        error: (error) => console.error("Error searching liquidaciones:", error),
      })
    } else {
      this.loadData()
    }
  }

  createFromQuotation(cotizacionId: number) {
    this.liquidacionService.createFromCotizacion(cotizacionId).subscribe({
      next: (liquidacion) => {
        this.editLiquidacion(liquidacion)
      },
      error: (error) => console.error("Error creating liquidation from quotation:", error),
    })
  }

  // Calculations
  calculateTotal(): number {
    const valorVenta = this.liquidacionForm.get("valorVenta")?.value || 0
    const cargoAdicional = this.liquidacionForm.get("cargoAdicional")?.value || 0
    const descuento = this.liquidacionForm.get("descuento")?.value || 0
    return valorVenta + cargoAdicional - descuento
  }

  calculateTotalPayments(): number {
    const pagoSoles = this.liquidacionForm.get("pagoSoles")?.value || 0
    const pagoDolares = this.liquidacionForm.get("pagoDolares")?.value || 0
    const pagoEuros = this.liquidacionForm.get("pagoEuros")?.value || 0
    // Convert to soles for comparison (simplified conversion)
    return pagoSoles + pagoDolares * 3.8 + pagoEuros * 4.2
  }

  getPaymentBalance(): number {
    return this.calculateTotal() - this.calculateTotalPayments()
  }

  getCotizacionNumber(cotizacionId: number): string {
    const cotizacion = this.cotizaciones.find((c) => c.id === cotizacionId)
    return cotizacion ? cotizacion.numero : "N/A"
  }

  getViajeroName(viajeroId: number): string {
    const viajero = this.viajeros.find((v) => v.id === viajeroId)
    return viajero ? `${viajero.nombre} ${viajero.apellido}` : "N/A"
  }

  getOperadorName(operadorId: number): string {
    const operador = this.operadores.find((o) => o.id === operadorId)
    return operador ? operador.nombre : "N/A"
  }

  getProveedorName(proveedorId: number): string {
    const proveedor = this.proveedores.find((p) => p.id === proveedorId)
    return proveedor ? proveedor.nombre : "N/A"
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case "pagada":
        return "badge-success"
      case "procesada":
        return "badge-warning"
      case "cancelada":
        return "badge-error"
      default:
        return "badge-secondary"
    }
  }

  updateDetailSubtotal(index: number) {
    const detalle = this.detallesLiquidacion[index]
    detalle.subtotal = detalle.cantidad * detalle.precioUnitario
  }
}
