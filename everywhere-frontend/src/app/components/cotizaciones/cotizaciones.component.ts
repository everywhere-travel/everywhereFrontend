import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule, ReactiveFormsModule, type FormBuilder, type FormGroup, Validators } from "@angular/forms"
import { RouterModule } from "@angular/router"
import type { CotizacionService } from "../../services/cotizacion.service"
import type { PersonaService } from "../../services/persona.service"
import type { Cotizacion, DetalleCotizacion, GrupoHotel, Hotel } from "../../models/cotizacion.model"
import type { PersonaNatural } from "../../models/persona.model"
import type { Producto } from "../../models/producto.model"

@Component({
  selector: "app-cotizaciones",
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./cotizaciones.component.html",
  styleUrls: ["./cotizaciones.component.css"],
})
export class CotizacionesComponent implements OnInit {
  // UI State
  showForm = false
  editingId: number | null = null
  loading = false
  searchQuery = ""

  // Forms
  cotizacionForm: FormGroup
  searchForm: FormGroup

  // Data
  cotizaciones: Cotizacion[] = []
  personas: PersonaNatural[] = []
  productosDisponibles: Producto[] = []
  gruposHoteles: GrupoHotel[] = []

  // Quotation Details
  productosSeleccionados: DetalleCotizacion[] = []
  gruposSeleccionados: GrupoHotel[] = []

  // Configuration
  monedas = [
    { value: "PEN", label: "Soles (PEN)" },
    { value: "USD", label: "Dólares (USD)" },
    { value: "EUR", label: "Euros (EUR)" },
  ]

  formasPago = [
    { value: "efectivo", label: "Efectivo" },
    { value: "tarjeta", label: "Tarjeta de Crédito" },
    { value: "transferencia", label: "Transferencia Bancaria" },
    { value: "deposito", label: "Depósito Bancario" },
  ]

  estados = [
    { value: "borrador", label: "Borrador" },
    { value: "enviada", label: "Enviada" },
    { value: "aprobada", label: "Aprobada" },
    { value: "rechazada", label: "Rechazada" },
    { value: "vencida", label: "Vencida" },
  ]

  constructor(
    private cotizacionService: CotizacionService,
    private personaService: PersonaService,
    private fb: FormBuilder,
  ) {
    this.cotizacionForm = this.createCotizacionForm()
    this.searchForm = this.createSearchForm()
  }

  ngOnInit() {
    this.loadData()
  }

  private createCotizacionForm(): FormGroup {
    return this.fb.group({
      numero: ["", Validators.required],
      fechaCotizacion: [new Date().toISOString().split("T")[0], Validators.required],
      fechaViaje: [""],
      fechaRetorno: [""],
      personaId: ["", Validators.required],
      numeroAdultos: [1, [Validators.required, Validators.min(1)]],
      numeroNinos: [0, [Validators.min(0)]],
      moneda: ["PEN", Validators.required],
      tipoCambio: [1, [Validators.required, Validators.min(0.01)]],
      formaPago: ["efectivo", Validators.required],
      estado: ["borrador", Validators.required],
      observaciones: [""],
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

    // Load quotations
    this.cotizacionService.getCotizaciones().subscribe({
      next: (data) => (this.cotizaciones = data),
      error: (error) => console.error("Error loading cotizaciones:", error),
    })

    // Load personas
    this.personaService.getPersonasNaturales().subscribe({
      next: (data) => (this.personas = data),
      error: (error) => console.error("Error loading personas:", error),
    })

    // Load hotel groups
    this.cotizacionService.getGruposHoteles().subscribe({
      next: (data) => {
        this.gruposHoteles = data
        this.loading = false
      },
      error: (error) => {
        console.error("Error loading grupos hoteles:", error)
        this.loading = false
      },
    })
  }

  toggleForm() {
    this.showForm = !this.showForm
    this.editingId = null
    if (this.showForm) {
      this.generateQuotationNumber()
      this.resetForm()
    }
  }

  resetForm() {
    this.cotizacionForm.reset({
      numero: "",
      fechaCotizacion: new Date().toISOString().split("T")[0],
      numeroAdultos: 1,
      numeroNinos: 0,
      moneda: "PEN",
      tipoCambio: 1,
      formaPago: "efectivo",
      estado: "borrador",
    })
    this.productosSeleccionados = []
    this.gruposSeleccionados = []
  }

  generateQuotationNumber() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")

    const numero = `COT-${year}${month}${day}-${random}`
    this.cotizacionForm.patchValue({ numero })
  }

  onSubmit() {
    if (this.cotizacionForm.valid) {
      const formData = this.cotizacionForm.value
      const cotizacion: Cotizacion = {
        ...formData,
        subtotal: this.calculateSubtotal(),
        impuestos: this.calculateTaxes(),
        total: this.calculateTotal(),
      }

      if (this.editingId) {
        this.cotizacionService.updateCotizacion(this.editingId, cotizacion).subscribe({
          next: () => {
            this.loadData()
            this.showForm = false
            this.editingId = null
          },
          error: (error) => console.error("Error updating cotizacion:", error),
        })
      } else {
        this.cotizacionService.createCotizacion(cotizacion).subscribe({
          next: (newCotizacion) => {
            // Save product details
            this.saveProductDetails(newCotizacion.id!)
            this.loadData()
            this.showForm = false
          },
          error: (error) => console.error("Error creating cotizacion:", error),
        })
      }
    }
  }

  private saveProductDetails(cotizacionId: number) {
    this.productosSeleccionados.forEach((detalle) => {
      const detalleToSave: DetalleCotizacion = {
        ...detalle,
        cotizacionId,
      }
      this.cotizacionService.addDetalleCotizacion(detalleToSave).subscribe({
        error: (error) => console.error("Error saving product detail:", error),
      })
    })
  }

  editCotizacion(cotizacion: Cotizacion) {
    this.editingId = cotizacion.id!
    this.showForm = true
    this.cotizacionForm.patchValue(cotizacion)

    // Load product details
    this.cotizacionService.getDetalleCotizacion(cotizacion.id!).subscribe({
      next: (detalles) => (this.productosSeleccionados = detalles),
      error: (error) => console.error("Error loading product details:", error),
    })
  }

  deleteCotizacion(id: number) {
    if (confirm("¿Está seguro de eliminar esta cotización?")) {
      this.cotizacionService.deleteCotizacion(id).subscribe({
        next: () => this.loadData(),
        error: (error) => console.error("Error deleting cotizacion:", error),
      })
    }
  }

  searchCotizaciones() {
    const searchData = this.searchForm.value
    if (searchData.searchValue.trim()) {
      this.cotizacionService.searchCotizaciones(searchData.searchValue).subscribe({
        next: (results) => (this.cotizaciones = results),
        error: (error) => console.error("Error searching cotizaciones:", error),
      })
    } else {
      this.loadData()
    }
  }

  // Product Management
  addProduct() {
    const newProduct: DetalleCotizacion = {
      cotizacionId: 0, // Will be set when saving
      productoId: 0,
      cantidad: 1,
      precioUnitario: 0,
      subtotal: 0,
      descripcion: "",
    }
    this.productosSeleccionados.push(newProduct)
  }

  removeProduct(index: number) {
    this.productosSeleccionados.splice(index, 1)
  }

  updateProductSubtotal(index: number) {
    const producto = this.productosSeleccionados[index]
    producto.subtotal = producto.cantidad * producto.precioUnitario
  }

  // Hotel Group Management
  toggleGrupoHotel(grupo: GrupoHotel) {
    const index = this.gruposSeleccionados.findIndex((g) => g.id === grupo.id)
    if (index > -1) {
      this.gruposSeleccionados.splice(index, 1)
    } else {
      this.gruposSeleccionados.push({ ...grupo, seleccionado: true })
    }
  }

  isGrupoSelected(grupoId: number): boolean {
    return this.gruposSeleccionados.some((g) => g.id === grupoId)
  }

  toggleHotelInGroup(grupoIndex: number, hotel: Hotel) {
    const grupo = this.gruposSeleccionados[grupoIndex]
    const hotelIndex = grupo.hoteles.findIndex((h) => h.id === hotel.id)

    if (hotelIndex > -1) {
      grupo.hoteles[hotelIndex].seleccionado = !grupo.hoteles[hotelIndex].seleccionado
    }
  }

  // Calculations
  calculateSubtotal(): number {
    const productosTotal = this.productosSeleccionados.reduce((sum, p) => sum + p.subtotal, 0)
    const hotelesTotal = this.gruposSeleccionados.reduce((sum, grupo) => {
      return (
        sum + grupo.hoteles.filter((h) => h.seleccionado).reduce((hotelSum, hotel) => hotelSum + hotel.precioNoche, 0)
      )
    }, 0)
    return productosTotal + hotelesTotal
  }

  calculateTaxes(): number {
    return this.calculateSubtotal() * 0.18 // 18% IGV
  }

  calculateTotal(): number {
    return this.calculateSubtotal() + this.calculateTaxes()
  }

  getPersonaName(personaId: number): string {
    const persona = this.personas.find((p) => p.id === personaId)
    return persona ? `${persona.nombre} ${persona.apellido}` : "N/A"
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case "aprobada":
        return "badge-success"
      case "enviada":
        return "badge-warning"
      case "rechazada":
        return "badge-error"
      default:
        return "badge-secondary"
    }
  }
}
