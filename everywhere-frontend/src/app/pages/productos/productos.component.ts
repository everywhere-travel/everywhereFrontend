import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductoService } from '../../core/service/Producto/producto.service';
import { ProductoRequest, ProductoResponse } from '../../shared/models/Producto/producto.model';
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';
import { ErrorModalComponent, ErrorModalData, BackendErrorResponse } from '../../shared/components/error-modal/error-modal.component';
import { ErrorHandlerService } from '../../shared/services/error-handler.service';

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
    SidebarComponent,
    ErrorModalComponent
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
          title: 'Clientes',
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
          id: 'viajeros-frecuentes',
          title: 'Viajeros Frecuentes',
          icon: 'fas fa-crown',
          route: '/viajero-frecuente'
        }
      ]
    },
    {
      id: 'cotizaciones',
      title: 'Cotizaciones',
      icon: 'fas fa-file-invoice',
      route: '/cotizaciones'
    },
    {
      id: 'liquidaciones',
      title: 'Liquidaciones',
      icon: 'fas fa-credit-card',
      route: '/liquidaciones'
    },
    {
      id: 'recursos',
      title: 'Recursos',
      icon: 'fas fa-box',
      active: true,
      children: [
        {
          id: 'productos',
          title: 'Productos',
          icon: 'fas fa-cube',
          route: '/productos'
        },
        {
          id: 'proveedores',
          title: 'Proveedores',
          icon: 'fas fa-truck',
          route: '/proveedores'
        },
        {
          id: 'operadores',
          title: 'Operadores',
          icon: 'fas fa-headset',
          route: '/operadores'
        },
        {
          id: 'documentos',
          title: 'Documentos',
          icon: 'fas fa-file-alt',
          route: '/documentos'
        }
      ]
    },
    {
      id: 'organización',
      title: 'Organización',
      icon: 'fas fa-sitemap',
      children: [
        {
          id: 'counters',
          title: 'Counters',
          icon: 'fas fa-users-line',
          route: '/counters'
        },
        {
          id: 'sucursales',
          title: 'Sucursales',
          icon: 'fas fa-building',
          route: '/sucursales'
        }
      ]
    },
    {
      id: 'archivos',
      title: 'Gestión de Archivos',
      icon: 'fas fa-folder',
      children: [
        {
          id: 'carpetas',
          title: 'Explorador',
          icon: 'fas fa-folder-open',
          route: '/carpetas'
        }
      ]
    },
    {
      id: 'reportes',
      title: 'Reportes y Analytics',
      icon: 'fas fa-chart-bar',
      children: [
        {
          id: 'estadisticas',
          title: 'Estadísticas',
          icon: 'fas fa-chart-line',
          route: '/estadistica'
        },
        {
          id: 'reportes-general',
          title: 'Reportes Generales',
          icon: 'fas fa-file-pdf',
          route: '/reportes'
        }
      ]
    },
    {
      id: 'configuracion',
      title: 'Configuración',
      icon: 'fas fa-cog',
      children: [
        {
          id: 'usuarios',
          title: 'Usuarios',
          icon: 'fas fa-user-shield',
          route: '/usuarios'
        },
        {
          id: 'sistema',
          title: 'Sistema',
          icon: 'fas fa-server',
          route: '/configuracion'
        }
      ]
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
  mostrarModalError = false;
  editandoProducto = false;
  productoSeleccionado: ProductoResponse | null = null;
  productoAEliminar: ProductoResponse | null = null;

  // Error modal data
  errorModalData: ErrorModalData | null = null;
  backendErrorData: BackendErrorResponse | null = null;

  searchTerm = '';
  selectedType = 'todos';
  currentView: 'table' | 'cards' | 'list' = 'table';

  // Sorting variables
  sortColumn: string = 'creado';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Variables para selección múltiple
  selectedItems: number[] = [];
  allSelected: boolean = false;
  someSelected: boolean = false;

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

  // Tipos únicos extraídos de los datos
  tiposUnicos: string[] = [];

  constructor(
    private fb: FormBuilder,
    private productoService: ProductoService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService
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
        this.cdr.detectChanges();
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

  cerrarModalError(): void {
    this.mostrarModalError = false;
    this.errorModalData = null;
    this.backendErrorData = null;
  }

  confirmarEliminacionModal(): void {
    if (this.productoAEliminar) {
      this.eliminarProductoDefinitivo(this.productoAEliminar.id);
    }
  }

  eliminarProductoDefinitivo(id: number): void {
    this.loading = true;
    this.productoService.deleteByIdProducto(id).subscribe({
      next: () => {
        this.cerrarModalEliminar();
        this.loadProductos();
      },
      error: (error) => {
        this.loading = false;
        this.cerrarModalEliminar();

        // Usar el servicio de manejo de errores
        const { modalData, backendError } = this.errorHandler.handleHttpError(error, 'eliminar producto');

        this.errorModalData = modalData;
        this.backendErrorData = backendError || null;
        this.mostrarModalError = true;

        console.error('Error al eliminar producto:', error);
      }
    });
  }

  // Modal management
  abrirModalCrear(): void {
    this.editandoProducto = false;
    this.productoSeleccionado = null;
    this.productoForm.reset();
    this.mostrarModalCrear = true;
  }

  editarProducto(productoTabla: ProductoTabla): void {
    // Buscar el producto completo en la lista original
    const productoCompleto = this.productos.find(p => p.id === productoTabla.id);

    if (productoCompleto) {
      this.editandoProducto = true;
      this.productoSeleccionado = productoCompleto;

      // Cargar los datos del producto en el formulario
      this.productoForm.patchValue({
        descripcion: productoCompleto.descripcion || '',
        tipo: productoCompleto.tipo || ''
      });

      this.mostrarModalCrear = true;
    } else {
      console.error('No se encontró el producto completo para editar');
    }
  }

  updateSelectionState(): void {
    const totalItems = this.filteredProductos.length;
    const selectedCount = this.selectedItems.length;

    this.allSelected = selectedCount === totalItems && totalItems > 0;
    this.someSelected = selectedCount > 0 && selectedCount < totalItems;
  }

  // Métodos para acciones masivas
  clearSelection(): void {
    this.selectedItems = [];
    this.updateSelectionState();
  }


  editarSeleccionados(): void {
    if (this.selectedItems.length === 0) return;

    if (this.selectedItems.length === 1) {
      const producto = this.productos.find(p => p.id === this.selectedItems[0]);
      if (producto) {
        this.editarProducto(producto);
      }
    } else {
      const producto = this.productos.find(p => p.id === this.selectedItems[0]);
      if (producto) {
        this.editarProducto(producto);
      }
    }
  }

  eliminarSeleccionados(): void {
    if (this.selectedItems.length === 0) return;

    const confirmMessage = `¿Está seguro de eliminar ${this.selectedItems.length} cliente${this.selectedItems.length > 1 ? 's' : ''}?\n\nEsta acción no se puede deshacer.`;
    if (confirm(confirmMessage)) {
      this.loading = true;
      let eliminados = 0;
      const total = this.selectedItems.length;

      this.selectedItems.forEach(id => {
        const producto = this.productos.find(p => p.id === id);
        if (producto) {
          this.productoService.deleteByIdProducto(id).subscribe({
            next: () => {
              eliminados++;
              if (eliminados === total) {
                this.loadProductos();
                this.clearSelection();
                this.loading = false;
              }
            },
            error: (error) => {
              console.error('Error al eliminar persona natural:', error);
              eliminados++;
              if (eliminados === total) {
                this.loadProductos();
                this.clearSelection();
                this.loading = false;
              }
            }
          });

        }
      });
    }
  }

  cerrarModal(): void {
    this.mostrarModalCrear = false;
    this.editandoProducto = false;
    this.productoSeleccionado = null;
    this.productoForm.reset();
  }

  refreshData(): void {
    this.loadProductos();
  }

  // Search and filter
  applyFilters(): void {
    let filtered = [...this.productosTabla];

    // Filtro por tipo
    if (this.selectedType !== 'todos') {
      filtered = filtered.filter(producto => producto.tipo === this.selectedType);
    }

    // Filtro por búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(producto => {
        const searchableText = `${producto.descripcion} ${producto.tipo}`.toLowerCase();
        return searchableText.includes(term);
      });
    }

    this.filteredProductos = filtered;
    this.totalItems = filtered.length;

    // Aplicar ordenamiento
    this.applySorting();

    // Extraer tipos únicos para el filtro
    this.extraerTiposUnicos();
  }

  // Extraer tipos únicos de los datos
  private extraerTiposUnicos(): void {
    const tipos = this.productosTabla.map(p => p.tipo).filter(tipo => tipo && tipo.trim() !== '');
    this.tiposUnicos = [...new Set(tipos)].sort();
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onTypeChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  private applySorting(): void {
    if (!this.filteredProductos.length) return;

    this.filteredProductos.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (this.sortColumn) {
        case 'tipo':
          valueA = a.tipo?.toLowerCase() || '';
          valueB = b.tipo?.toLowerCase() || '';
          break;
        case 'descripcion':
          valueA = a.descripcion?.toLowerCase() || '';
          valueB = b.descripcion?.toLowerCase() || '';
          break;
        case 'creado':
          valueA = new Date(a.creado || 0);
          valueB = new Date(b.creado || 0);
          break;
        case 'actualizado':
          valueA = new Date(a.actualizado || 0);
          valueB = new Date(b.actualizado || 0);
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // Métodos para selección múltiple
  toggleAllSelection(): void {
    if (this.allSelected) {
      this.selectedItems = [];
    } else {
      this.selectedItems = this.filteredProductos.map(p => p.id!);
    }
    this.updateSelectionState();
  }

  toggleSelection(id: number): void {
    const index = this.selectedItems.indexOf(id);
    if (index > -1) {
      this.selectedItems.splice(index, 1);
    } else {
      this.selectedItems.push(id);
    }
    this.updateSelectionState();
  }

  isSelected(id: number): boolean {
    return this.selectedItems.includes(id);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  // Pagination
  get paginatedProductos(): ProductoTabla[] {
    const itemsPerPageNum = Number(this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * itemsPerPageNum;
    const endIndex = startIndex + itemsPerPageNum;
    return this.filteredProductos.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    const itemsPerPageNum = Number(this.itemsPerPage);
    return Math.ceil(this.totalItems / itemsPerPageNum);
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
    return tipo || 'Sin tipo';
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
    return this.selectedType !== 'todos';
  }

  clearAllFilters(): void {
    this.searchTerm = '';
    this.selectedType = 'todos';
    this.onSearchChange();
  }

  onItemsPerPageChange(): void {
    this.itemsPerPage = Number(this.itemsPerPage);
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
