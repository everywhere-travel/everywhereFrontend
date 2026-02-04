import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ProveedorService } from '../../core/service/Proveedor/proveedor.service';
import { ProveedorRequest, ProveedorResponse } from '../../shared/models/Proveedor/proveedor.model';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ErrorModalComponent, ErrorModalData, BackendErrorResponse } from '../../shared/components/error-modal/error-modal.component';
import { ErrorHandlerService } from '../../shared/services/error-handler.service';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { DataTableConfig } from '../../shared/components/data-table/data-table.config';

// Interface para la tabla
export interface ProveedorTabla {
  id: number;
  nombre: string;
  creado: string;
  actualizado: string;
}

@Component({
  selector: 'app-proveedor',
  standalone: true,
  templateUrl: './proveedor.component.html',
  styleUrls: ['./proveedor.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SidebarComponent,
    ErrorModalComponent,
    DataTableComponent
  ]
})
export class ProveedorComponent implements OnInit {

  // Sidebar Configuration
  sidebarCollapsed = false;
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

  isLoading: boolean = false;
  // Forms
  proveedorForm!: FormGroup;

  // Data arrays
  proveedores: ProveedorResponse[] = [];
  proveedoresTabla: ProveedorTabla[] = [];
  filteredProveedores: ProveedorTabla[] = [];

  // Control variables
  loading = false;
  mostrarModalCrear = false;
  mostrarModalEliminar = false;
  mostrarModalError = false;
  editandoProveedor = false;
  proveedorSeleccionado: ProveedorResponse | null = null;
  proveedorAEliminar: ProveedorResponse | null = null;

  // Error modal data
  errorModalData: ErrorModalData | null = null;
  backendErrorData: BackendErrorResponse | null = null;

  // Alert messages
  errorMessage: string = '';
  successMessage: string = '';
  showErrorMessage: boolean = false;
  showSuccessMessage: boolean = false;

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
  totalProveedores = 0;

  // Math object for template use
  Math = Math;

  // Configuración de DataTable
  tableConfig: DataTableConfig<ProveedorTabla> = {
    data: [],
    columns: [
      {
        key: 'nombre',
        header: 'Nombre',
        icon: 'fa-building',
        sortable: true,
        render: (item) => item.nombre || 'N/A'
      },
      {
        key: 'creado',
        header: 'Fecha Creación',
        icon: 'fa-calendar-alt',
        sortable: true,
        width: '150px',
        render: (item) => this.formatDate(item.creado)
      },
      {
        key: 'actualizado',
        header: 'Fecha Actualización',
        icon: 'fa-calendar-alt',
        sortable: true,
        width: '150px',
        render: (item) => this.formatDate(item.actualizado)
      }
    ],
    enableSearch: true,
    searchPlaceholder: 'Buscar proveedores...',
    enableSelection: true,
    enablePagination: true,
    enableViewSwitcher: true,
    enableSorting: true,
    itemsPerPage: 10,
    pageSizeOptions: [5, 10, 25, 50],
    actions: [
      {
        icon: 'fa-edit',
        label: 'Editar',
        color: 'blue',
        handler: (item) => this.editarProveedor(item)
      },
      {
        icon: 'fa-trash',
        label: 'Eliminar',
        color: 'red',
        handler: (item) => this.confirmarEliminar(this.proveedores.find(p => p.id === item.id)!)
      }
    ],
    emptyMessage: 'No se encontraron proveedores',
    loadingMessage: 'Cargando proveedores...',
    defaultView: 'table',
    enableRowHover: true,
    trackByKey: 'id'
  };

  constructor(
    private fb: FormBuilder,
    private proveedorService: ProveedorService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private menuConfigService: MenuConfigService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/proveedores');
    this.loadProveedores();
    this.calcularEstadisticas();
  }

  // =================================================================
  // SIDEBAR FILTERING
  // ================================================================= 
  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: ExtendedSidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  private initializeForms(): void {
    this.proveedorForm = this.fb.group({
      nombre: ['']
    });
  }

  // CRUD Operations
  loadProveedores(): void {
    this.loading = true;
    this.proveedorService.findAllProveedor().subscribe({
      next: (proveedores) => {
        this.proveedores = proveedores;
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
    this.proveedoresTabla = this.proveedores.map(proveedor => ({
      id: proveedor.id,
      nombre: proveedor.nombre,
      creado: proveedor.creado,
      actualizado: proveedor.actualizado
    }));
    this.totalProveedores = this.proveedoresTabla.length; 
    this.tableConfig = {
      ...this.tableConfig,
      data: this.proveedoresTabla
    };
  }

  // Método principal para guardar (crea o actualiza según el estado)
  guardarProveedor(): void {
    if (this.editandoProveedor) {
      this.actualizarProveedor();
    } else {
      this.crearProveedor();
    }
  }

  crearProveedor(): void {
    if (this.proveedorForm.valid) {
      this.loading = true;
      const proveedorRequest: ProveedorRequest = this.proveedorForm.value;

      this.proveedorService.createProveedor(proveedorRequest).subscribe({
        next: (response) => {
          this.showSuccess('Proveedor creado correctamente');
          this.loadProveedores();
          this.cerrarModal();
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          const errorMessage = error?.error?.detail ||
            error?.error?.message ||
            error?.message ||
            'Error al crear proveedor';
          this.showError(errorMessage);
        }
      });
    }
  }

  actualizarProveedor(): void {
    if (this.proveedorForm.valid && this.proveedorSeleccionado) {
      this.loading = true;
      const proveedorRequest: ProveedorRequest = this.proveedorForm.value;

      this.proveedorService.updateProveedor(this.proveedorSeleccionado.id, proveedorRequest).subscribe({
        next: (response) => {
          this.showSuccess('Proveedor actualizado correctamente');
          this.loadProveedores();
          this.cerrarModal();
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          const errorMessage = error?.error?.detail ||
            error?.error?.message ||
            error?.message ||
            'Error al actualizar proveedor';
          this.showError(errorMessage);
        }
      });
    }
  }

  editarProveedor(proveedor: ProveedorTabla): void {
    this.editandoProveedor = true;
    this.proveedorSeleccionado = this.proveedores.find(p => p.id === proveedor.id) || null;

    if (this.proveedorSeleccionado) {
      this.proveedorForm.patchValue({
        nombre: this.proveedorSeleccionado.nombre || ''
      });

      this.mostrarModalCrear = true;
    }
  }

  eliminarProveedor(id: number): void {
    const proveedor = this.proveedores.find(p => p.id === id);
    if (proveedor) {
      this.proveedorAEliminar = proveedor;
      this.mostrarModalEliminar = true;
    }
  }

  // Modal de confirmación de eliminación
  confirmarEliminar(proveedor: ProveedorResponse): void {
    this.proveedorAEliminar = proveedor;
    this.mostrarModalEliminar = true;
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.proveedorAEliminar = null;
  }

  // Nuevo método para confirmar eliminación desde el modal
  confirmarEliminacionModal(): void {
    if (this.proveedorAEliminar) {
      this.eliminarProveedorDefinitivo(this.proveedorAEliminar.id);
    }
  }

  eliminarProveedorDefinitivo(id: number): void {
    this.loading = true;
    this.proveedorService.deleteByIdProveedor(id).subscribe({
      next: () => {
        this.cerrarModalEliminar();
        this.showSuccess('Proveedor eliminado correctamente');
        this.loadProveedores();
      },
      error: (error) => {
        this.loading = false;
        this.cerrarModalEliminar();

        // Capturar error con RFC 7807 priority: detail > message > fallback
        const errorMessage = error?.error?.detail ||
          error?.error?.message ||
          error?.message ||
          'Error al eliminar proveedor';
        this.showError(errorMessage);
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
    this.editandoProveedor = false;
    this.proveedorSeleccionado = null;
    this.proveedorForm.reset();
    this.mostrarModalCrear = true;
  }

  cerrarModal(): void {
    this.mostrarModalCrear = false;
    this.editandoProveedor = false;
    this.proveedorSeleccionado = null;
    this.proveedorForm.reset();
  }

  updateSelectionState(): void {
    const totalItems = this.filteredProveedores.length;
    const selectedCount = this.selectedItems.length;

    this.allSelected = selectedCount === totalItems && totalItems > 0;
    this.someSelected = selectedCount > 0 && selectedCount < totalItems;
  }

  refreshData(): void {
    this.loadProveedores();
  }

  // Métodos para acciones masivas
  clearSelection(): void {
    this.selectedItems = [];
    this.updateSelectionState();
  }

  editarSeleccionados(): void {
    if (this.selectedItems.length === 0) return;

    if (this.selectedItems.length === 1) {
      const proveedor = this.proveedores.find(p => p.id === this.selectedItems[0]);
      if (proveedor) {
        this.editarProveedor(proveedor);
      }
    } else {
      const proveedor = this.proveedores.find(p => p.id === this.selectedItems[0]);
      if (proveedor) {
        this.editarProveedor(proveedor);
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
        const proveedor = this.proveedores.find(p => p.id === id);
        if (proveedor) {
          this.proveedorService.deleteByIdProveedor(id).subscribe({
            next: () => {
              eliminados++;
              if (eliminados === total) {
                this.loadProveedores();
                this.clearSelection();
                this.loading = false;
              }
            },
            error: (error) => {
              console.error('Error al eliminar persona natural:', error);
              eliminados++;
              if (eliminados === total) {
                this.loadProveedores();
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
    let filtered = [...this.proveedoresTabla];

    // Filtro por búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(proveedor => {
        const searchableText = `${proveedor.nombre}`.toLowerCase();
        return searchableText.includes(term);
      });
    }

    this.filteredProveedores = filtered;
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
    if (!this.filteredProveedores.length) return;

    this.filteredProveedores.sort((a, b) => {
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
  get paginatedProveedores(): ProveedorTabla[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredProveedores.slice(startIndex, endIndex);
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
    this.calcularEstadisticas();
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
      this.selectedItems = this.filteredProveedores.map(p => p.id!);
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

  // Statistics
  calcularEstadisticas(): void {
    // Aquí puedes agregar lógica para calcular estadísticas específicas
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

  trackByProveedorId(index: number, item: ProveedorTabla): number {
    return item.id;
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.showErrorMessage = true;
    this.showSuccessMessage = false;
    setTimeout(() => {
      this.showErrorMessage = false;
    }, 5000);
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.showSuccessMessage = true;
    this.showErrorMessage = false;
    setTimeout(() => {
      this.showSuccessMessage = false;
    }, 3000);
  }

  public hideMessages(): void {
    this.showErrorMessage = false;
    this.showSuccessMessage = false;
  }
}
