import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { EstadoCotizacionService } from './../../core/service/EstadoCotizacion/estado-cotizacion.service';
import { ErrorHandlerService } from '../../shared/services/error-handler.service';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';

import { EstadoCotizacionRequest, EstadoCotizacionResponse } from './../../shared/models/Cotizacion/estadoCotizacion.model';

import { ErrorModalComponent, ErrorModalData, BackendErrorResponse } from '../../shared/components/error-modal/error-modal.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

// Interface para la tabla
export interface EstadoCotizacionTabla {
  id: number;
  descripcion: string;
  creado: string;
  actualizado: string;
}

@Component({
  selector: 'app-estado-cotizacion',
  standalone: true,
  templateUrl: './estado-cotizacion.component.html',
  styleUrls: ['./estado-cotizacion.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SidebarComponent,
    ErrorModalComponent
  ]
})
export class EstadoCotizacionComponent implements OnInit {

  // Sidebar Configuration
  sidebarCollapsed = false;
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

  // Forms
  estadoCotizacionForm!: FormGroup;

  // Data arrays
  estadosCotizacion: EstadoCotizacionResponse[] = [];
  EstadoCotizacionTabla: EstadoCotizacionTabla[] = [];
  filteredEstadoCotizacion: EstadoCotizacionTabla[] = [];

  // Control variables
  loading = false;
  mostrarModalCrear = false;
  mostrarModalEliminar = false;
  mostrarModalError = false;
  editandoEstadoCotizacion = false;
  estadoCotizacionSeleccionada: EstadoCotizacionResponse | null = null;
  estadoCotizacionAEliminar: EstadoCotizacionResponse | null = null;

  // Alert system
  errorAlertMessage: string = '';
  successAlertMessage: string = '';
  showErrorAlert: boolean = false;
  showSuccessAlert: boolean = false;

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
  totalEstadoCotizacion = 0;

  // Math object for template use
  Math = Math;

  constructor(
    private fb: FormBuilder,
    private estadoCotizacionService: EstadoCotizacionService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService, 
    private menuConfigService: MenuConfigService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadEstadosCotizacion();
    this.calcularEstadisticas();
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/estado-cotizacion');
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
    this.estadoCotizacionForm = this.fb.group({
      descripcion: ['']
    });
  }

  // CRUD Operations
  loadEstadosCotizacion(): void {
    this.loading = true;
    this.estadoCotizacionService.getAllEstadosCotizacion().subscribe({
      next: (estadosCotizacion) => {
        this.estadosCotizacion = estadosCotizacion;
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
    this.EstadoCotizacionTabla = this.estadosCotizacion.map(estadoCotizacion => ({
      id: estadoCotizacion.id,
      descripcion: estadoCotizacion.descripcion || '',
      creado: estadoCotizacion.fechaCreacion,
      actualizado: estadoCotizacion.fechaActualizacion
    }));
    this.totalEstadoCotizacion = this.EstadoCotizacionTabla.length;
  }

  // Método principal para guardar (crea o actualiza según el estado)
  guardarEstadoCotizacion(): void {
    if (this.editandoEstadoCotizacion) {
      this.actualizarEstadoCotizacion();
    } else {
      this.crearEstadoCotizacion();
    }
  }

  crearEstadoCotizacion(): void {
    if (this.estadoCotizacionForm.valid) {
      this.loading = true;
      const estadoCotizacionRequest: EstadoCotizacionRequest = this.estadoCotizacionForm.value;

      this.estadoCotizacionService.createEstadoCotizacion(estadoCotizacionRequest).subscribe({
        next: (response) => {
          this.showSuccess('Estado de Cotización creado correctamente');
          this.loadEstadosCotizacion();
          this.cerrarModal();
          this.loading = false;
        },
        error: (error) => {
          const errorMessage = error?.error?.detail ||
                              error?.error?.message ||
                              error?.message ||
                              'Error al crear el estado de cotización';
          this.showError(errorMessage);
          this.loading = false;
        }
      });
    }
  }

  actualizarEstadoCotizacion(): void {
    if (this.estadoCotizacionForm.valid && this.estadoCotizacionSeleccionada) {
      this.loading = true;
      const estadoCotizacionRequest: EstadoCotizacionRequest = this.estadoCotizacionForm.value;

      this.estadoCotizacionService.updateEstadoCotizacion(this.estadoCotizacionSeleccionada.id, estadoCotizacionRequest).subscribe({
        next: (response) => {
          this.showSuccess('Estado de Cotización actualizado correctamente');
          this.loadEstadosCotizacion();
          this.cerrarModal();
          this.loading = false;
        },
        error: (error) => {
          const errorMessage = error?.error?.detail ||
                              error?.error?.message ||
                              error?.message ||
                              'Error al actualizar el estado de cotización';
          this.showError(errorMessage);
          this.loading = false;
        }
      });
    }
  }

  editarEstadoCotizacion(estadoCotizacion: EstadoCotizacionTabla): void {
    this.editandoEstadoCotizacion = true;
    this.estadoCotizacionSeleccionada = this.estadosCotizacion.find(c => c.id === estadoCotizacion.id) || null;

    if (this.estadoCotizacionSeleccionada) {
      this.estadoCotizacionForm.patchValue({
        descripcion: this.estadoCotizacionSeleccionada.descripcion || ''
      });

      this.mostrarModalCrear = true;
    }
  }

  eliminarEstadoCotizacion(id: number): void {
    const estadoCotizacion = this.estadosCotizacion.find(c => c.id === id);
    if (estadoCotizacion) {
      this.estadoCotizacionAEliminar = estadoCotizacion;
      this.mostrarModalEliminar = true;
    }
  }

  // Modal de confirmación de eliminación
  confirmarEliminar(estadoCotizacion: EstadoCotizacionResponse): void {
    this.estadoCotizacionAEliminar = estadoCotizacion;
    this.mostrarModalEliminar = true;
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.estadoCotizacionAEliminar = null;
  }

  // Nuevo método para confirmar eliminación desde el modal
  confirmarEliminacionModal(): void {
    if (this.estadoCotizacionAEliminar) {
      this.eliminarEstadoCotizacionDefinitivo(this.estadoCotizacionAEliminar.id);
    }
  }

  eliminarEstadoCotizacionDefinitivo(id: number): void {
    this.loading = true;
    this.estadoCotizacionService.deleteByIdEstadoCotizacion(id).subscribe({
      next: () => {
        this.showSuccess('Estado de Cotización eliminado correctamente');
        this.cerrarModalEliminar();
        this.loadEstadosCotizacion();
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        const errorMessage = error?.error?.detail ||
                            error?.error?.message ||
                            error?.message ||
                            'Error al eliminar el estado de cotización';
        this.showError(errorMessage);
        this.cerrarModalEliminar();
        console.error('Error al eliminar estado de cotizacion:', error);
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
    this.editandoEstadoCotizacion = false;
    this.estadoCotizacionSeleccionada = null;
    this.estadoCotizacionForm.reset();
    this.mostrarModalCrear = true;
  }

  cerrarModal(): void {
    this.mostrarModalCrear = false;
    this.editandoEstadoCotizacion = false;
    this.estadoCotizacionSeleccionada = null;
    this.estadoCotizacionForm.reset();
  }

  updateSelectionState(): void {
    const totalItems = this.filteredEstadoCotizacion.length;
    const selectedCount = this.selectedItems.length;

    this.allSelected = selectedCount === totalItems && totalItems > 0;
    this.someSelected = selectedCount > 0 && selectedCount < totalItems;
  }

  refreshData(): void {
    this.loadEstadosCotizacion();
  }

  // Métodos para acciones masivas
  clearSelection(): void {
    this.selectedItems = [];
    this.updateSelectionState();
  }

  editarSeleccionados(): void {
    if (this.selectedItems.length === 0) return;

    if (this.selectedItems.length === 1) {
      const EstadoCotizacionTabla = this.EstadoCotizacionTabla.find(c => c.id === this.selectedItems[0]);
      if (EstadoCotizacionTabla) {
        this.editarEstadoCotizacion(EstadoCotizacionTabla);
      }
    } else {
      const EstadoCotizacionTabla = this.EstadoCotizacionTabla.find(c => c.id === this.selectedItems[0]);
      if (EstadoCotizacionTabla) {
        this.editarEstadoCotizacion(EstadoCotizacionTabla);
      }
    }
  }

  eliminarSeleccionados(): void {
    if (this.selectedItems.length === 0) return;

    const confirmMessage = `¿Está seguro de eliminar ${this.selectedItems.length} estado${this.selectedItems.length > 1 ? 's' : ''}?\n\nEsta acción no se puede deshacer.`;
    if (confirm(confirmMessage)) {
      this.loading = true;
      let eliminados = 0;
      const total = this.selectedItems.length;

      this.selectedItems.forEach(id => {
        const estadoCotizacion = this.estadosCotizacion.find(p => p.id === id);
        if (estadoCotizacion) {
          this.estadoCotizacionService.deleteByIdEstadoCotizacion(estadoCotizacion.id).subscribe({
            next: () => {
              eliminados++;
              if (eliminados === total) {
                this.loadEstadosCotizacion();
                this.clearSelection();
                this.loading = false;
              }
            },
            error: (error) => {
              console.error('Error al eliminar estado de cotizacion:', error);
              eliminados++;
              if (eliminados === total) {
                this.loadEstadosCotizacion();
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
    let filtered = [...this.EstadoCotizacionTabla];

    // Filtro por búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(estadoCotizacion => {
        const searchableText = `${estadoCotizacion.descripcion}`.toLowerCase();
        return searchableText.includes(term);
      });
    }

    this.filteredEstadoCotizacion = filtered;
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
    if (!this.filteredEstadoCotizacion.length) return;

    this.filteredEstadoCotizacion.sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';

      switch (this.sortColumn) {
        case 'nombre':
          aValue = a.descripcion || '';
          bValue = b.descripcion || '';
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
  get paginatedEstadoCotizacion(): EstadoCotizacionTabla[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredEstadoCotizacion.slice(startIndex, endIndex);
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
      this.selectedItems = this.filteredEstadoCotizacion.map(p => p.id!);
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

  trackByEstadoCotizacionId(index: number, item: EstadoCotizacionTabla): number {
    return item.id;
  }

  // ===== ALERT SYSTEM =====
  private showError(message: string): void {
    this.errorAlertMessage = message;
    this.showErrorAlert = true;
    this.showSuccessAlert = false;

    setTimeout(() => {
      this.showErrorAlert = false;
    }, 5000);
  }

  private showSuccess(message: string): void {
    this.successAlertMessage = message;
    this.showSuccessAlert = true;
    this.showErrorAlert = false;

    setTimeout(() => {
      this.showSuccessAlert = false;
    }, 3000);
  }

  public hideAlerts(): void {
    this.showErrorAlert = false;
    this.showSuccessAlert = false;
  }
}
