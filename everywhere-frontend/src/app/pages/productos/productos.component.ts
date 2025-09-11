import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductoService } from '../../core/service/Producto/producto.service';
import { ProductoRequest, ProductoResponse } from '../../shared/models/Producto/producto.model';
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';

// Interface para la tabla de productos
export interface ProductoTabla {
  id: number;
  codigo: string;
  descripcion: string;
  tipo: string;
  creado: string;
  actualizado: string;
}

@Component({
  selector: 'app-productos',
  standalone: true,
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css'],
  imports: [
    CommonModule,
    FormsModule, 
    ReactiveFormsModule,
    SidebarComponent
  ]
})
export class ProductosComponent implements OnInit {

  // Sidebar Configuration
  sidebarCollapsed = false;
  sidebarMenuItems: SidebarMenuItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'fas fa-chart-pie',
      route: '/dashboard'
    },
    {
      id: 'clientes',
      title: 'Gestión de Clientes',
      icon: 'fas fa-users',
      children: [
        {
          id: 'personas',
          title: 'Personas',
          icon: 'fas fa-address-card',
          route: '/personas'
        },
        {
          id: 'viajeros',
          title: 'Viajeros',
          icon: 'fas fa-passport',
          route: '/viajero'
        },
        {
          id: 'viajero-frecuente',
          title: 'Viajero Frecuente',
          icon: 'fas fa-star',
          route: '/viajero-frecuente'
        }
      ]
    },
    {
      id: 'productos',
      title: 'Productos y Servicios',
      icon: 'fas fa-box',
      active: true,
      children: [
        {
          id: 'productos',
          title: 'Productos',
          icon: 'fas fa-cube',
          route: '/productos'
        }
      ]
    },
    {
      id: 'cotizaciones',
      title: 'Cotizaciones',
      icon: 'fas fa-file-invoice-dollar',
      route: '/cotizaciones'
    },
    {
      id: 'liquidaciones',
      title: 'Liquidaciones',
      icon: 'fas fa-calculator',
      route: '/liquidaciones'
    },
    {
      id: 'reportes',
      title: 'Reportes',
      icon: 'fas fa-chart-bar',
      route: '/reportes'
    },
    {
      id: 'estadisticas',
      title: 'Estadísticas',
      icon: 'fas fa-chart-line',
      route: '/estadistica'
    }
  ];

  // Data
  productos: ProductoResponse[] = [];
  productosTabla: ProductoTabla[] = [];
  filteredProductos: ProductoTabla[] = [];
  
  // Forms
  productoForm!: FormGroup;
  
  // Control variables
  loading = false;
  mostrarModalCrear = false;
  mostrarModalEliminar = false;
  editandoProducto = false;
  productoSeleccionado: ProductoResponse | null = null;
  productoAEliminar: ProductoResponse | null = null;
  searchTerm = '';
  currentView: 'table' | 'cards' | 'list' = 'table';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  
  // Dropdowns and menus
  showActionMenu: number | null = null;
  showQuickActions: number | null = null;
  
  // Estadísticas
  totalProductos = 0;
  
  // Math object for template use
  Math = Math;
  
  // Tipos de producto disponibles
  tiposProducto = [
    { value: 'TRANSPORTE', label: 'Transporte' },
    { value: 'HOSPEDAJE', label: 'Hospedaje' },
    { value: 'TOUR', label: 'Tour' },
    { value: 'ALIMENTACION', label: 'Alimentación' },
    { value: 'SEGURO', label: 'Seguro' },
    { value: 'ENTRETENIMIENTO', label: 'Entretenimiento' },
    { value: 'ACTIVIDAD', label: 'Actividad' },
    { value: 'SERVICIO', label: 'Servicio' },
    { value: 'PRODUCTO', label: 'Producto' },
    { value: 'OTRO', label: 'Otro' }
  ];

  constructor(
    private fb: FormBuilder,
    private productoService: ProductoService,
    private router: Router
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadProductos();
    this.calcularEstadisticas();
  }

  private initializeForms(): void {
    this.productoForm = this.fb.group({
      descripcion: [''],
      tipo: ['']
    });
  }

  // CRUD Operations
  loadProductos(): void {
    this.loading = true;
    this.productoService.getAllProductos().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.convertirATabla();
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.loading = false;
      }
    });
  }

  private convertirATabla(): void {
    this.productosTabla = this.productos.map(producto => ({
      id: producto.id,
      codigo: producto.codigo,
      descripcion: producto.descripcion,
      tipo: producto.tipo,
      creado: producto.creado,
      actualizado: producto.actualizado
    }));
    this.totalProductos = this.productosTabla.length;
  }

  // Método principal para guardar (crea o actualiza según el estado)
  guardarProducto(): void {
    if (this.editandoProducto) {
      this.actualizarProducto();
    } else {
      this.crearProducto();
    }
  }

  crearProducto(): void {
    if (this.productoForm.valid) {
      this.loading = true;
      const productoRequest: ProductoRequest = this.productoForm.value;
      
      this.productoService.createProducto(productoRequest).subscribe({
        next: (response) => {
          console.log('Producto creado exitosamente:', response);
          this.loadProductos();
          this.cerrarModal();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al crear producto:', error);
          this.loading = false;
        }
      });
    }
  }

  actualizarProducto(): void {
    if (this.productoForm.valid && this.productoSeleccionado) {
      this.loading = true;
      const productoRequest: ProductoRequest = this.productoForm.value;
      
      this.productoService.updateProducto(this.productoSeleccionado.id, productoRequest).subscribe({
        next: (response) => {
          console.log('Producto actualizado exitosamente:', response);
          this.loadProductos();
          this.cerrarModal();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al actualizar producto:', error);
          this.loading = false;
        }
      });
    }
  }

  eliminarProducto(id: number): void {
    // Buscar el producto a eliminar
    const producto = this.productos.find(p => p.id === id);
    if (producto) {
      this.productoAEliminar = producto;
      this.mostrarModalEliminar = true;
    }
  }

  // Modal de confirmación de eliminación
  confirmarEliminar(producto: ProductoResponse): void {
    this.productoAEliminar = producto;
    this.mostrarModalEliminar = true;
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.productoAEliminar = null;
  }

  confirmarEliminacionModal(): void {
    if (this.productoAEliminar?.id) {
      this.loading = true;
      this.productoService.deleteByIdProducto(this.productoAEliminar.id).subscribe({
        next: () => {
          console.log('Producto eliminado exitosamente');
          this.loadProductos();
          this.cerrarModalEliminar();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al eliminar producto:', error);
          this.loading = false;
        }
      });
    }
  }

  // Modal management
  abrirModalCrear(): void {
    this.editandoProducto = false;
    this.productoSeleccionado = null;
    this.productoForm.reset();
    this.mostrarModalCrear = true;
  }

  editarProducto(productoTabla: ProductoTabla): void {
    console.log('Editando producto:', productoTabla);
    
    // Buscar el producto completo en la lista original
    const productoCompleto = this.productos.find(p => p.id === productoTabla.id);
    
    if (productoCompleto) {
      console.log('Producto completo encontrado:', productoCompleto);
      console.log('Tipo del producto:', productoCompleto.tipo);
      console.log('Tipos disponibles:', this.tiposProducto);
      
      this.editandoProducto = true;
      this.productoSeleccionado = productoCompleto;
      
      // Limpiar y normalizar el tipo
      const tipoNormalizado = productoCompleto.tipo?.trim().toUpperCase() || '';
      console.log('Tipo normalizado:', tipoNormalizado);
      
      // Verificar si el tipo existe en nuestras opciones
      const tipoExiste = this.tiposProducto.some(t => t.value === tipoNormalizado);
      console.log('¿Tipo existe en opciones?:', tipoExiste);
      
      // Si el tipo no existe, agregarlo temporalmente
      if (!tipoExiste && tipoNormalizado) {
        console.log('Agregando tipo temporal:', tipoNormalizado);
        this.tiposProducto.push({ 
          value: tipoNormalizado, 
          label: tipoNormalizado.charAt(0) + tipoNormalizado.slice(1).toLowerCase() 
        });
      }
      
      // Cargar los datos del producto en el formulario
      this.productoForm.patchValue({
        descripcion: productoCompleto.descripcion || '',
        tipo: tipoNormalizado
      });
      
      console.log('Formulario después de patchValue:', this.productoForm.value);
      console.log('Control tipo después de patchValue:', this.productoForm.get('tipo')?.value);
      
      this.mostrarModalCrear = true;
    } else {
      console.error('No se encontró el producto completo para editar');
    }
  }

  cerrarModal(): void {
    this.mostrarModalCrear = false;
    this.editandoProducto = false;
    this.productoSeleccionado = null;
    this.productoForm.reset();
  }

  // Search and filter
  applyFilters(): void {
    let filtered = [...this.productosTabla];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(producto =>
        producto.descripcion.toLowerCase().includes(term) ||
        producto.codigo.toLowerCase().includes(term) ||
        producto.tipo.toLowerCase().includes(term)
      );
    }

    this.filteredProductos = filtered;
    this.totalItems = filtered.length;
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  // Pagination
  get paginatedProductos(): ProductoTabla[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredProductos.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Estadísticas
  calcularEstadisticas(): void {
    this.totalProductos = this.productos.length;
  }

  // Action menus
  toggleActionMenu(productoId: number, event: Event): void {
    event.stopPropagation();
    this.showActionMenu = this.showActionMenu === productoId ? null : productoId;
    this.showQuickActions = null;
  }

  toggleQuickActions(productoId: number, event: Event): void {
    event.stopPropagation();
    this.showQuickActions = this.showQuickActions === productoId ? null : productoId;
    this.showActionMenu = null;
  }

  // Utilities
  getTipoLabel(tipo: string): string {
    const tipoObj = this.tiposProducto.find(t => t.value === tipo);
    return tipoObj ? tipoObj.label : tipo;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES');
  }

  // Listener para cerrar menus al hacer click fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.action-menu-container')) {
      this.showActionMenu = null;
      this.showQuickActions = null;
    }
  }

  // Sidebar methods
  onSidebarItemClick(item: SidebarMenuItem): void {
    console.log('Sidebar item clicked:', item);
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  // Métodos para cambiar entre vistas
  changeView(view: 'table' | 'cards' | 'list'): void {
    this.currentView = view;
  }

  isActiveView(view: 'table' | 'cards' | 'list'): boolean {
    return this.currentView === view;
  }

  // Métodos para estadísticas del header
  getActiveProductsCount(): number {
    return this.productos.filter(p => p.id).length; // Asumiendo que productos activos son los que tienen ID
  }

  getUniqueTypesCount(): number {
    const tipos = new Set(this.productos.map(p => p.tipo));
    return tipos.size;
  }

  // Método para obtener clases de color por tipo
  getTipoColorClass(tipo: string): string {
    const colorMap: { [key: string]: string } = {
      'TRANSPORTE': 'bg-blue-100 text-blue-800',
      'HOSPEDAJE': 'bg-green-100 text-green-800',
      'TOUR': 'bg-purple-100 text-purple-800',
      'ALIMENTACION': 'bg-orange-100 text-orange-800',
      'SEGURO': 'bg-red-100 text-red-800',
      'OTRO': 'bg-gray-100 text-gray-800'
    };
    return colorMap[tipo] || 'bg-gray-100 text-gray-800';
  }

  // Métodos para filtros
  hasActiveFilters(): boolean {
    return false; // Por ahora no hay filtros adicionales implementados
  }

  clearAllFilters(): void {
    this.searchTerm = '';
    this.onSearchChange();
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.calcularEstadisticas();
  }

  // Método para actualizar datos paginados
  updatePaginatedData(): void {
    this.calcularEstadisticas();
  }

  // Métodos para paginación (remover el getter duplicado)
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getVisiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2;

    let start = Math.max(1, current - delta);
    let end = Math.min(total, current + delta);

    if (end - start < 2 * delta) {
      if (start === 1) {
        end = Math.min(total, start + 2 * delta);
      } else if (end === total) {
        start = Math.max(1, end - 2 * delta);
      }
    }

    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}
