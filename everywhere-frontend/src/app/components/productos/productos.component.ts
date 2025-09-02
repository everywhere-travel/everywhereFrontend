import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule, ReactiveFormsModule, type FormBuilder, type FormGroup, Validators } from "@angular/forms"
import type { ProductoService } from "../../services/producto.service"
import type { Producto, Proveedor, Operador } from "../../models/producto.model"

@Component({
  selector: "app-productos",
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: "./productos.component.html",
  styleUrls: ["./productos.component.css"],
})
export class ProductosComponent implements OnInit {
  activeTab: "productos" | "proveedores" | "operadores" | "hoteles" = "productos"
  showForm = false
  editingId: number | null = null
  loading = false
  searchQuery = ""

  // Forms
  productoForm: FormGroup
  proveedorForm: FormGroup
  operadorForm: FormGroup
  hotelForm: FormGroup

  // Data
  productos: Producto[] = []
  proveedores: Proveedor[] = []
  operadores: Operador[] = []
  hoteles: any[] = []

  // Configuration
  categorias = [
    { value: "hotel", label: "Hotel" },
    { value: "vuelo", label: "Vuelo" },
    { value: "transporte", label: "Transporte" },
    { value: "tour", label: "Tour" },
    { value: "seguro", label: "Seguro" },
    { value: "alimentacion", label: "Alimentación" },
    { value: "actividad", label: "Actividad" },
    { value: "otros", label: "Otros" },
  ]

  monedas = [
    { value: "PEN", label: "Soles (PEN)" },
    { value: "USD", label: "Dólares (USD)" },
    { value: "EUR", label: "Euros (EUR)" },
  ]

  constructor(
    private productoService: ProductoService,
    private fb: FormBuilder,
  ) {
    this.productoForm = this.createProductoForm()
    this.proveedorForm = this.createProveedorForm()
    this.operadorForm = this.createOperadorForm()
    this.hotelForm = this.createHotelForm()
  }

  ngOnInit() {
    this.loadData()
  }

  private createProductoForm(): FormGroup {
    return this.fb.group({
      codigo: ["", [Validators.required, Validators.minLength(3)]],
      nombre: ["", [Validators.required, Validators.minLength(3)]],
      descripcion: [""],
      categoria: ["", Validators.required],
      precio: [0, [Validators.required, Validators.min(0)]],
      moneda: ["PEN", Validators.required],
      proveedorId: [""],
      operadorId: [""],
      activo: [true],
    })
  }

  private createProveedorForm(): FormGroup {
    return this.fb.group({
      nombre: ["", [Validators.required, Validators.minLength(3)]],
      contacto: [""],
      telefono: [""],
      email: ["", [Validators.email]],
      direccion: [""],
    })
  }

  private createOperadorForm(): FormGroup {
    return this.fb.group({
      nombre: ["", [Validators.required, Validators.minLength(3)]],
      codigo: [""],
      contacto: [""],
      telefono: [""],
      email: ["", [Validators.email]],
    })
  }

  private createHotelForm(): FormGroup {
    return this.fb.group({
      nombre: ["", [Validators.required, Validators.minLength(3)]],
      categoria: [1, [Validators.required, Validators.min(1), Validators.max(5)]],
      ubicacion: ["", Validators.required],
      precioNoche: [0, [Validators.required, Validators.min(0)]],
      descripcion: [""],
      servicios: [""],
      activo: [true],
    })
  }

  loadData() {
    this.loading = true

    this.productoService.getProductos().subscribe({
      next: (data) => (this.productos = data),
      error: (error) => console.error("Error loading productos:", error),
    })

    this.productoService.getProveedores().subscribe({
      next: (data) => (this.proveedores = data),
      error: (error) => console.error("Error loading proveedores:", error),
    })

    this.productoService.getOperadores().subscribe({
      next: (data) => {
        this.operadores = data
        this.loading = false
      },
      error: (error) => {
        console.error("Error loading operadores:", error)
        this.loading = false
      },
    })
  }

  setActiveTab(tab: "productos" | "proveedores" | "operadores" | "hoteles") {
    this.activeTab = tab
    this.showForm = false
    this.editingId = null
  }

  toggleForm() {
    this.showForm = !this.showForm
    this.editingId = null
    this.resetCurrentForm()
  }

  resetCurrentForm() {
    switch (this.activeTab) {
      case "productos":
        this.productoForm.reset({ moneda: "PEN", activo: true })
        break
      case "proveedores":
        this.proveedorForm.reset()
        break
      case "operadores":
        this.operadorForm.reset()
        break
      case "hoteles":
        this.hotelForm.reset({ categoria: 1, activo: true })
        break
    }
  }

  onSubmit() {
    const currentForm = this.getCurrentForm()
    if (currentForm.valid) {
      const formData = currentForm.value

      switch (this.activeTab) {
        case "productos":
          this.saveProducto(formData)
          break
        case "proveedores":
          this.saveProveedor(formData)
          break
        case "operadores":
          this.saveOperador(formData)
          break
        case "hoteles":
          this.saveHotel(formData)
          break
      }
    }
  }

  private getCurrentForm(): FormGroup {
    switch (this.activeTab) {
      case "productos":
        return this.productoForm
      case "proveedores":
        return this.proveedorForm
      case "operadores":
        return this.operadorForm
      case "hoteles":
        return this.hotelForm
    }
  }

  private saveProducto(data: Producto) {
    if (this.editingId) {
      this.productoService.updateProducto(this.editingId, data).subscribe({
        next: () => {
          this.loadData()
          this.showForm = false
          this.editingId = null
        },
        error: (error) => console.error("Error updating producto:", error),
      })
    } else {
      this.productoService.createProducto(data).subscribe({
        next: () => {
          this.loadData()
          this.showForm = false
        },
        error: (error) => console.error("Error creating producto:", error),
      })
    }
  }

  private saveProveedor(data: Proveedor) {
    this.productoService.createProveedor(data).subscribe({
      next: () => {
        this.loadData()
        this.showForm = false
      },
      error: (error) => console.error("Error creating proveedor:", error),
    })
  }

  private saveOperador(data: Operador) {
    this.productoService.createOperador(data).subscribe({
      next: () => {
        this.loadData()
        this.showForm = false
      },
      error: (error) => console.error("Error creating operador:", error),
    })
  }

  private saveHotel(data: any) {
    // Hotel saving logic would go here
    console.log("Saving hotel:", data)
    this.showForm = false
  }

  editItem(item: any) {
    this.editingId = item.id
    this.showForm = true

    switch (this.activeTab) {
      case "productos":
        this.productoForm.patchValue(item)
        break
      case "proveedores":
        this.proveedorForm.patchValue(item)
        break
      case "operadores":
        this.operadorForm.patchValue(item)
        break
      case "hoteles":
        this.hotelForm.patchValue(item)
        break
    }
  }

  deleteItem(id: number) {
    if (confirm("¿Está seguro de eliminar este elemento?")) {
      switch (this.activeTab) {
        case "productos":
          this.productoService.deleteProducto(id).subscribe({
            next: () => this.loadData(),
            error: (error) => console.error("Error deleting producto:", error),
          })
          break
        // Add other delete operations as needed
      }
    }
  }

  searchItems() {
    if (this.searchQuery.trim()) {
      switch (this.activeTab) {
        case "productos":
          this.productoService.searchProductos(this.searchQuery).subscribe({
            next: (results) => (this.productos = results),
            error: (error) => console.error("Error searching productos:", error),
          })
          break
        // Add other search operations as needed
      }
    } else {
      this.loadData()
    }
  }

  get currentData() {
    switch (this.activeTab) {
      case "productos":
        return this.productos
      case "proveedores":
        return this.proveedores
      case "operadores":
        return this.operadores
      case "hoteles":
        return this.hoteles
    }
  }

  get currentForm() {
    return this.getCurrentForm()
  }

  getProveedorName(proveedorId: number): string {
    const proveedor = this.proveedores.find((p) => p.id === proveedorId)
    return proveedor ? proveedor.nombre : "N/A"
  }

  getOperadorName(operadorId: number): string {
    const operador = this.operadores.find((o) => o.id === operadorId)
    return operador ? operador.nombre : "N/A"
  }

  getCategoriaLabel(categoria: string): string {
    const cat = this.categorias.find((c) => c.value === categoria)
    return cat ? cat.label : categoria
  }

  getStarRating(categoria: number): string {
    return "★".repeat(categoria) + "☆".repeat(5 - categoria)
  }
}
