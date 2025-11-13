import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoriaPersonaService } from '../../core/service/CategoriaPersona/categoria-persona.service';
import { CategoriaPersonaRequest, CategoriaPersonaResponse } from '../../shared/models/CategoriaPersona/categoriaPersona.models';
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';
import { ErrorModalComponent, ErrorModalData, BackendErrorResponse } from '../../shared/components/error-modal/error-modal.component';
import { ErrorHandlerService } from '../../shared/services/error-handler.service';
import { AuthServiceService } from '../../core/service/auth/auth.service';

// Extender la interfaz para agregar moduleKey
interface ExtendedSidebarMenuItem extends SidebarMenuItem {
  moduleKey?: string;
  children?: ExtendedSidebarMenuItem[];
}

// Interface para la tabla
export interface CategoriaPersonaTabla {
  id: number;
  nombre: string;
  descripcion: string;
  creado: string;
  actualizado: string;
}


@Component({
  selector: 'app-categoria-persona',
  standalone: true,
  templateUrl: './categoria-persona.component.html',
  styleUrls: ['./categoria-persona.component.css'],
  imports: [
      CommonModule,
      FormsModule,
      ReactiveFormsModule,
      SidebarComponent,
      ErrorModalComponent
    ]
})
export class CategoriaPersonaComponent implements OnInit {

  // Sidebar Configuration
  sidebarCollapsed = false;
  private allSidebarMenuItems: ExtendedSidebarMenuItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'fas fa-chart-pie',
      route: '/dashboard'
    },

    {
      id: 'clientes',
      title: 'Clientes',
      icon: 'fas fa-address-book',
      route: '/personas',
      moduleKey: 'PERSONAS'
    },
    {
      id: 'cotizaciones',
      title: 'Cotizaciones',
      icon: 'fas fa-file-invoice',
      route: '/cotizaciones',
      moduleKey: 'COTIZACIONES'
    },
    {
      id: 'liquidaciones',
      title: 'Liquidaciones',
      icon: 'fas fa-credit-card',
      route: '/liquidaciones',
      moduleKey: 'LIQUIDACIONES'
    },
    {
      id: 'documentos',
      title: 'Documentos de clientes',
      icon: 'fas fa-file-alt',
      route: '/documentos',
      moduleKey: 'DOCUMENTOS'
    },
    {
      id: 'documentos-cobranza',
      title: 'Documentos de Cobranza',
      icon: 'fas fa-file-contract',
      route: '/documentos-cobranza',
      moduleKey: 'DOCUMENTOS_COBRANZA'
    },
    {
      id: 'categorias',
      title: 'Gestion de Categorias',
      icon: 'fas fa-box',
      active: true,
      children: [
        {
          id: 'categorias-persona',
          title: 'Categorias de Clientes',
          icon: 'fas fa-users',
          route: '/categorias-persona',
          moduleKey: 'CATEGORIA_PERSONAS'
        },
        {
          id: 'categorias-producto',
          title: 'Categorias de Producto',
          icon: 'fas fa-list',
          route: '/categorias',
        },
        {
          id: 'estado-cotizacion',
          title: 'Estado de Cotización',
          icon: 'fas fa-clipboard-check',
          route: '/estado-cotizacion',
          moduleKey: 'COTIZACIONES'
        },
        {
          id: 'forma-pago',
          title: 'Forma de Pago',
          icon: 'fas fa-credit-card',
          route: '/formas-pago',
          moduleKey: 'FORMA_PAGO'
        }
      ]
    },
    {
      id: 'recursos',
      title: 'Recursos',
      icon: 'fas fa-box',
      children: [
        {
          id: 'productos',
          title: 'Productos',
          icon: 'fas fa-cube',
          route: '/productos',
          moduleKey: 'PRODUCTOS'
        },
        {
          id: 'proveedores',
          title: 'Proveedores',
          icon: 'fas fa-truck',
          route: '/proveedores',
          moduleKey: 'PROVEEDORES'
        },
        {
          id: 'operadores',
          title: 'Operadores',
          icon: 'fas fa-headset',
          route: '/operadores',
          moduleKey: 'OPERADOR'
        }
      ]
    },
    {
      id: 'organización',
      title: 'Organización',
      icon: 'fas fa-sitemap',
      children: [
        {
          id: 'sucursales',
          title: 'Sucursales',
          icon: 'fas fa-building',
          route: '/sucursales',
          moduleKey: 'SUCURSALES'
        }
      ]
    }
  ];

  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

  // Forms
  categoriaPersonaForm!: FormGroup;

  // Data arrays
  categoriasPersona: CategoriaPersonaResponse[] = [];
  categoriaPersonaTabla: CategoriaPersonaTabla[] = [];
  filteredCategoriaPersona: CategoriaPersonaTabla[] = [];

  // Control variables
  loading = false;
  mostrarModalCrear = false;
  mostrarModalEliminar = false;
  mostrarModalError = false;
  editandoCategoriaPersona = false;
  categoriaPersonaSeleccionada: CategoriaPersonaResponse | null = null;
  categoriaPersonaAEliminar: CategoriaPersonaResponse | null = null;

  // Error modal data
  errorModalData: ErrorModalData | null = null;
  backendErrorData: BackendErrorResponse | null = null;

  searchTerm = '';
  currentView: 'table' | 'cards' | 'list' = 'table';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  itemsPerPageOptions = [5, 10, 25, 50];

  // Sorting
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Variables para selección múltiple
  selectedItems: number[] = [];
  allSelected: boolean = false;
  someSelected: boolean = false;

  // Menu states
  showActionMenu: number | null = null;
  showQuickActions: number | null = null;

  // Estadísticas
  totalCategoriaPersona = 0;

  // Math object for template use
  Math = Math;

  constructor(
    private fb: FormBuilder,
    private categoriaPersonaService: CategoriaPersonaService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private authService: AuthServiceService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.initializeSidebar();
    this.loadCategoriasPersona();
  }

  // =================================================================
  // SIDEBAR FILTERING
  // =================================================================

  private initializeSidebar(): void {
    const authData = this.authService.getUser();
    const userPermissions = authData?.permissions || {};

    // Si tiene ALL_MODULES, mostrar todos los items, sino filtrar por permisos específicos
    if (userPermissions['ALL_MODULES']) {
      this.sidebarMenuItems = this.allSidebarMenuItems;
    } else {
      this.sidebarMenuItems = this.filterSidebarItems(this.allSidebarMenuItems, userPermissions);
    }
  }

  private filterSidebarItems(items: ExtendedSidebarMenuItem[], userPermissions: any): ExtendedSidebarMenuItem[] {
    return items.filter(item => {
      // Dashboard siempre visible
      if (item.id === 'dashboard') {
        return true;
      }

      // Items sin moduleKey (como configuración, reportes) siempre visibles
      if (!item.moduleKey) {
        // Si tiene children, filtrar los children
        if (item.children) {
          const filteredChildren = this.filterSidebarItems(item.children, userPermissions);
          // Solo mostrar el padre si tiene al menos un hijo visible
          if (filteredChildren.length > 0) {
            return {
              ...item,
              children: filteredChildren
            };
          }
          return false;
        }
        return true;
      }

      // Verificar si el usuario tiene permisos para este módulo
      const hasPermission = Object.keys(userPermissions).includes(item.moduleKey);

      if (hasPermission) {
        // Si tiene children, filtrar los children también
        if (item.children) {
          const filteredChildren = this.filterSidebarItems(item.children, userPermissions);
          return {
            ...item,
            children: filteredChildren
          };
        }
        return true;
      }

      return false;
    }).map(item => {
      // Asegurar que los children filtrados se apliquen correctamente
      if (item.children) {
        return {
          ...item,
          children: this.filterSidebarItems(item.children, userPermissions)
        };
      }
      return item;
    }).filter(item => {
      // Filtrar items padre que no tengan children después del filtrado
      if (item.children) {
        return item.children.length > 0;
      }
      return true;
    });
  }

  // Sidebar methods
  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: ExtendedSidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  private initializeForms(): void {
    this.categoriaPersonaForm = this.fb.group({
      nombre: [''],
      descripcion: ['']
    });
  }

  // CRUD Operations
  loadCategoriasPersona(): void {
    this.loading = true;
    this.categoriaPersonaService.findAll().subscribe({
      next: (categoriasPersona) => {
        this.categoriasPersona = categoriasPersona;
        this.convertirATabla();
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar proveedores:', error);
        this.loading = false;
      }
    });
  }

  private convertirATabla(): void {
    this.categoriaPersonaTabla = this.categoriasPersona.map(categoria => ({
      id: categoria.id,
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
      creado: categoria.creado,
      actualizado: categoria.actualizado
    }));
    this.totalCategoriaPersona = this.categoriaPersonaTabla.length;
  }

  // Método principal para guardar (crea o actualiza según el estado)
  guardarCategoriaPersona(): void {
    if (this.editandoCategoriaPersona) {
      this.actualizarCategoriaPersona();
    } else {
      this.crearCategoriaPersona();
    }
  }

  crearCategoriaPersona(): void {
    if (this.categoriaPersonaForm.valid) {
      this.loading = true;
      const categoriaPersonaRequest: CategoriaPersonaRequest = this.categoriaPersonaForm.value;

      this.categoriaPersonaService.save(categoriaPersonaRequest).subscribe({
        next: (response) => {
          this.loadCategoriasPersona();
          this.cerrarModal();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al crear categoría de persona:', error);
          this.loading = false;
        }
      });
    }
  }

  actualizarCategoriaPersona(): void {
    if (this.categoriaPersonaForm.valid && this.categoriaPersonaSeleccionada) {
      this.loading = true;
      const categoriaPersonaRequest: CategoriaPersonaRequest = this.categoriaPersonaForm.value;

      this.categoriaPersonaService.patch(this.categoriaPersonaSeleccionada.id, categoriaPersonaRequest).subscribe({
        next: (response) => {
          this.loadCategoriasPersona();
          this.cerrarModal();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al actualizar categoría de persona:', error);
          this.loading = false;
        }
      });
    }
  }

  editarCategoriaPersona(categoriaPersona: CategoriaPersonaTabla): void {
    this.editandoCategoriaPersona = true;
    this.categoriaPersonaSeleccionada = this.categoriasPersona.find(c => c.id === categoriaPersona.id) || null;

    if (this.categoriaPersonaSeleccionada) {
      this.categoriaPersonaForm.patchValue({
        nombre: this.categoriaPersonaSeleccionada.nombre || '',
        descripcion: this.categoriaPersonaSeleccionada.descripcion || ''
      });

      this.mostrarModalCrear = true;
    }
  }

  eliminarCategoriaPersona(id: number): void {
    const categoriaPersona = this.categoriasPersona.find(c => c.id === id);
    if (categoriaPersona) {
      this.categoriaPersonaAEliminar = categoriaPersona;
      this.mostrarModalEliminar = true;
    }
  }

  // Modal de confirmación de eliminación
  confirmarEliminar(categoriaPersona: CategoriaPersonaResponse): void {
    this.categoriaPersonaAEliminar = categoriaPersona;
    this.mostrarModalEliminar = true;
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.categoriaPersonaAEliminar = null;
  }

  // Nuevo método para confirmar eliminación desde el modal
  confirmarEliminacionModal(): void {
    if (this.categoriaPersonaAEliminar) {
      this.eliminarCategoriaPersonaDefinitivo(this.categoriaPersonaAEliminar.id);
    }
  }

  eliminarCategoriaPersonaDefinitivo(id: number): void {
    this.loading = true;
    this.categoriaPersonaService.deleteById(id).subscribe({
      next: () => {
        this.cerrarModalEliminar();
        this.loadCategoriasPersona();
      },
      error: (error) => {
        this.loading = false;
        this.cerrarModalEliminar();

        // Usar el servicio de manejo de errores
        const { modalData, backendError } = this.errorHandler.handleHttpError(error, 'eliminar proveedor');

        this.errorModalData = modalData;
        this.backendErrorData = backendError || null;
        this.mostrarModalError = true;

        console.error('Error al eliminar proveedor:', error);
      }
    });
  }

  cerrarModalError(): void {
    this.mostrarModalError = false;
    this.errorModalData = null;
    this.backendErrorData = null;
  }

  // Modal management
  abrirModalCrear(): void {
    this.editandoCategoriaPersona = false;
    this.categoriaPersonaSeleccionada = null;
    this.categoriaPersonaForm.reset();
    this.mostrarModalCrear = true;
  }

  cerrarModal(): void {
    this.mostrarModalCrear = false;
    this.editandoCategoriaPersona = false;
    this.categoriaPersonaSeleccionada = null;
    this.categoriaPersonaForm.reset();
  }

  updateSelectionState(): void {
    const totalItems = this.filteredCategoriaPersona.length;
    const selectedCount = this.selectedItems.length;

    this.allSelected = selectedCount === totalItems && totalItems > 0;
    this.someSelected = selectedCount > 0 && selectedCount < totalItems;
  }

  refreshData(): void {
    this.loadCategoriasPersona();
  }

  // Métodos para acciones masivas
  clearSelection(): void {
    this.selectedItems = [];
    this.updateSelectionState();
  }

  editarSeleccionados(): void {
    if (this.selectedItems.length === 0) return;

    if (this.selectedItems.length === 1) {
      const categoriaPersonaTabla = this.categoriaPersonaTabla.find(c => c.id === this.selectedItems[0]);
      if (categoriaPersonaTabla) {
        this.editarCategoriaPersona(categoriaPersonaTabla);
      }
    } else {
      const categoriaPersonaTabla = this.categoriaPersonaTabla.find(c => c.id === this.selectedItems[0]);
      if (categoriaPersonaTabla) {
        this.editarCategoriaPersona(categoriaPersonaTabla);
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
        const categoriaPersona = this.categoriasPersona.find(p => p.id === id);
        if (categoriaPersona) {
          this.categoriaPersonaService.deleteById(categoriaPersona.id).subscribe({
            next: () => {
              eliminados++;
              if (eliminados === total) {
                this.loadCategoriasPersona();
                this.clearSelection();
                this.loading = false;
              }
            },
            error: (error) => {
              console.error('Error al eliminar persona natural:', error);
              eliminados++;
              if (eliminados === total) {
                this.loadCategoriasPersona();
                this.clearSelection();
                this.loading = false;
              }
            }
          });

        }
      });
    }
  }

  // Search and filter
  applyFilters(): void {
    let filtered = [...this.categoriaPersonaTabla];

    // Filtro por búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(categoriaPersona => {
        const searchableText = `${categoriaPersona.nombre}`.toLowerCase();
        return searchableText.includes(term);
      });
    }

    this.filteredCategoriaPersona = filtered;
    this.totalItems = filtered.length;

    // Aplicar ordenamiento
    this.applySorting();
  }

  // Sorting functionality
  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  applySorting(): void {
    if (!this.filteredCategoriaPersona.length) return;

    this.filteredCategoriaPersona.sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';

      switch (this.sortColumn) {
        case 'nombre':
          aValue = a.nombre || '';
          bValue = b.nombre || '';
          break;
        case 'creado':
          aValue = new Date(a.creado);
          bValue = new Date(b.creado);
          break;
        case 'actualizado':
          aValue = new Date(a.actualizado);
          bValue = new Date(b.actualizado);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return 'fas fa-sort text-gray-400';
    return this.sortDirection === 'asc'
      ? 'fas fa-sort-up text-blue-500'
      : 'fas fa-sort-down text-blue-500';
  }

  // Pagination
  get paginatedCategoriasPersona(): CategoriaPersonaTabla[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredCategoriaPersona.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
  }

  getVisiblePages(): number[] {
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;
    const visiblePages: number[] = [];

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      visiblePages.push(i);
    }

    return visiblePages;
  }

  // View management
  setView(view: 'table' | 'cards' | 'list'): void {
    this.currentView = view;
  }

  // Métodos para selección múltiple
  toggleAllSelection(): void {
    if (this.allSelected) {
      this.selectedItems = [];
    } else {
      this.selectedItems = this.filteredCategoriaPersona.map(p => p.id!);
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

  // Menu handling
  toggleActionMenu(id: number, event: Event): void {
    event.stopPropagation();
    this.showActionMenu = this.showActionMenu === id ? null : id;
    this.showQuickActions = null;
  }

  toggleQuickActions(id: number, event: Event): void {
    event.stopPropagation();
    this.showQuickActions = this.showQuickActions === id ? null : id;
    this.showActionMenu = null;
  }

  @HostListener('document:click', ['$event'])
  closeMenus(event: Event): void {
    this.showActionMenu = null;
    this.showQuickActions = null;
  }

  closeAllMenus(): void {
    this.showActionMenu = null;
    this.showQuickActions = null;
  }

  // Utility functions
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  trackByCategoriaPersonaId(index: number, item: CategoriaPersonaTabla): number {
    return item.id;
  }
}
