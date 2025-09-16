import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OperadorService } from '../../core/service/Operador/operador.service';
import { OperadorRequest, OperadorResponse } from '../../shared/models/Operador/operador.model';
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';
import { ErrorModalComponent } from '../../shared/components/error-modal/error-modal.component';
import { ErrorHandlerService } from '../../shared/services/error-handler.service';

@Component({
  selector: 'app-operadores',
  standalone: true,
  templateUrl: './operadores.component.html',
  styleUrls: ['./operadores.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SidebarComponent,
    ErrorModalComponent
  ]
})
export class OperadoresComponent implements OnInit {

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
      route: '/cotizaciones',
      badge: '12',
      badgeColor: 'blue'
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

  // Formulario
  operadorForm!: FormGroup;

  // Variables de control
  loading: boolean = false;
  isLoading: boolean = false;
  searchTerm: string = '';
  searchQuery: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  sortColumn: string = 'nombre';

  // Variables de control para las vistas
  currentView: 'table' | 'cards' | 'list' = 'table';

  // Variables para modales
  showModal: boolean = false;
  isEditMode: boolean = false;
  editingId: number | null = null;
  showConfirmModal: boolean = false;
  operadorToDelete: OperadorResponse | null = null;
  showErrorModal: boolean = false;
  errorMessage: string = '';

  // Variables para menú de acciones - separados por vista
  showActionMenu: number | null = null;
  showActionMenuCards: number | null = null;
  showActionMenuList: number | null = null;
  showQuickActions: number | null = null;

  // Variables para selección múltiple
  selectedItems: number[] = [];
  allSelected: boolean = false;
  someSelected: boolean = false;

  // Variables para paginación
  pageSize: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;

  // Datos
  operadores: OperadorResponse[] = [];
  operadoresFiltrados: OperadorResponse[] = [];
  paginatedOperadores: OperadorResponse[] = [];

  constructor(
    private fb: FormBuilder,
    private operadorService: OperadorService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadOperadores();
  }

  // Inicialización del formulario
  private initializeForm(): void {
    this.operadorForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
    });
  }

  // Carga de datos
  loadOperadores(): void {
    this.loading = true;
    this.isLoading = true;
    
    this.operadorService.findAllOperador().subscribe({
      next: (operadores) => {
        this.operadores = operadores || [];
        this.applyFilters();
        this.loading = false;
        this.isLoading = false;
      },
      error: (error) => {
        const { modalData } = this.errorHandler.handleHttpError(error, 'cargar operadores');
        this.showError(modalData.message);
        this.loading = false;
        this.isLoading = false;
      }
    });
  }

  // Filtros y búsqueda
  applyFilters(): void {
    let filtered = [...this.operadores];

    // Filtro por búsqueda
    if (this.searchQuery.trim()) {
      const term = this.searchQuery.toLowerCase();
      filtered = filtered.filter(operador => 
        operador.nombre?.toLowerCase().includes(term)
      );
    }

    this.operadoresFiltrados = filtered;
    this.applySorting();
    this.calculatePagination();
    this.updatePaginatedData();
    this.updateSelectionState();
  }

  private applySorting(): void {
    if (!this.operadoresFiltrados.length) return;
    
    this.operadoresFiltrados.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (this.sortColumn) {
        case 'nombre':
          valueA = a.nombre?.toLowerCase() || '';
          valueB = b.nombre?.toLowerCase() || '';
          break;
        case 'creado':
          valueA = new Date(a.creado);
          valueB = new Date(b.creado);
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

  // Métodos de búsqueda
  onSearchChange(): void {
    this.searchTerm = this.searchQuery;
    this.currentPage = 1;
    this.applyFilters();
  }

  searchOperadores(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  // Métodos de ordenamiento
  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
    this.updatePaginatedData();
  }

  // Gestión de modales
  openCreateModal(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.operadorForm.reset();
    this.showModal = true;
  }

  openEditModal(operador: OperadorResponse): void {
    this.closeAllMenus();
    this.isEditMode = true;
    this.editingId = operador.id;
    this.operadorForm.patchValue({
      nombre: operador.nombre || ''
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.editingId = null;
    this.operadorForm.reset();
    
    // Limpiar selecciones después de editar
    if (this.editingId) {
      this.selectedItems = this.selectedItems.filter(id => id !== this.editingId);
      this.updateSelectionState();
    }
  }

  // CRUD Operations
  onSubmit(): void {
    if (this.operadorForm.invalid) {
      this.markFormGroupTouched(this.operadorForm);
      return;
    }

    const formData = this.operadorForm.value;
    const request: OperadorRequest = {
      nombre: formData.nombre?.trim()
    };

    this.loading = true;

    if (this.isEditMode && this.editingId) {
      this.operadorService.updateOperador(this.editingId, request).subscribe({
        next: () => {
          this.loadOperadores();
          this.closeModal();
        },
        error: (error) => {
          const { modalData } = this.errorHandler.handleHttpError(error, 'actualizar operador');
          this.showError(modalData.message);
          this.loading = false;
        }
      });
    } else {
      this.operadorService.createOperador(request).subscribe({
        next: () => {
          this.loadOperadores();
          this.closeModal();
        },
        error: (error) => {
          const { modalData } = this.errorHandler.handleHttpError(error, 'crear operador');
          this.showError(modalData.message);
          this.loading = false;
        }
      });
    }
  }

  // Eliminar operador
  confirmDelete(operador: OperadorResponse): void {
    this.closeAllMenus();
    this.operadorToDelete = operador;
    this.showConfirmModal = true;
  }

  executeDelete(): void {
    if (this.operadorToDelete) {
      this.loading = true;
      this.operadorService.deleteByIdOperador(this.operadorToDelete.id).subscribe({
        next: () => {
          this.loadOperadores();
          this.closeConfirmModal();
          // Actualizar selecciones
          this.selectedItems = this.selectedItems.filter(id => id !== this.operadorToDelete!.id);
          this.updateSelectionState();
        },
        error: (error) => {
          const { modalData } = this.errorHandler.handleHttpError(error, 'eliminar operador');
          this.showError(modalData.message);
          this.loading = false;
        }
      });
    }
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.operadorToDelete = null;
  }

  // Métodos para el menú de acciones
  toggleActionMenu(id: number): void {
    this.showQuickActions = null;
    this.showActionMenuCards = null;
    this.showActionMenuList = null;
    this.showActionMenu = this.showActionMenu === id ? null : id;
  }

  toggleActionMenuCards(id: number): void {
    this.showQuickActions = null;
    this.showActionMenu = null;
    this.showActionMenuList = null;
    this.showActionMenuCards = this.showActionMenuCards === id ? null : id;
  }

  toggleActionMenuList(id: number): void {
    this.showQuickActions = null;
    this.showActionMenu = null;
    this.showActionMenuCards = null;
    this.showActionMenuList = this.showActionMenuList === id ? null : id;
  }

  toggleQuickActions(id: number): void {
    this.showActionMenu = null;
    this.showActionMenuCards = null;
    this.showActionMenuList = null;
    this.showQuickActions = this.showQuickActions === id ? null : id;
  }

  closeAllMenus(): void {
    this.showActionMenu = null;
    this.showActionMenuCards = null;
    this.showActionMenuList = null;
    this.showQuickActions = null;
  }

  // Métodos para selección múltiple
  toggleAllSelection(): void {
    if (this.allSelected) {
      this.selectedItems = [];
    } else {
      this.selectedItems = this.paginatedOperadores.map(o => o.id);
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

  updateSelectionState(): void {
    const visibleIds = this.paginatedOperadores.map(o => o.id);
    const selectedVisibleItems = this.selectedItems.filter(id => visibleIds.includes(id));
    
    this.allSelected = visibleIds.length > 0 && selectedVisibleItems.length === visibleIds.length;
    this.someSelected = selectedVisibleItems.length > 0 && selectedVisibleItems.length < visibleIds.length;
  }

  clearSelection(): void {
    this.selectedItems = [];
    this.updateSelectionState();
  }

  // Acciones masivas
  deleteSelected(): void {
    if (this.selectedItems.length === 0) return;

    const confirmMessage = `¿Está seguro de eliminar ${this.selectedItems.length} operador${this.selectedItems.length > 1 ? 'es' : ''}?`;
    if (confirm(confirmMessage)) {
      this.loading = true;
      let deletedCount = 0;
      const totalToDelete = this.selectedItems.length;

      this.selectedItems.forEach(id => {
        this.operadorService.deleteByIdOperador(id).subscribe({
          next: () => {
            deletedCount++;
            if (deletedCount === totalToDelete) {
              this.loadOperadores();
              this.clearSelection();
            }
          },
          error: (error) => {
            const { modalData } = this.errorHandler.handleHttpError(error, 'eliminar operadores');
            this.showError(modalData.message);
            deletedCount++;
            if (deletedCount === totalToDelete) {
              this.loadOperadores();
              this.clearSelection();
            }
          }
        });
      });
    }
  }

  // Métodos para cambiar entre vistas
  changeView(view: 'table' | 'cards' | 'list'): void {
    this.currentView = view;
    this.closeAllMenus();
  }

  isActiveView(view: 'table' | 'cards' | 'list'): boolean {
    return this.currentView === view;
  }

  // Métodos de paginación
  calculatePagination(): void {
    this.totalPages = Math.ceil(this.operadoresFiltrados.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  updatePaginatedData(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedOperadores = this.operadoresFiltrados.slice(startIndex, endIndex);
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.calculatePagination();
    this.updatePaginatedData();
    this.clearSelection();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.updatePaginatedData();
    this.clearSelection();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedData();
      this.clearSelection();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedData();
      this.clearSelection();
    }
  }

  getPageInfo(): string {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.operadoresFiltrados.length);
    return `${start}-${end} de ${this.operadoresFiltrados.length}`;
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Métodos de utilidad
  refreshData(): void {
    this.loadOperadores();
  }

  exportData(): void {
    // TODO: Implementar exportación
    console.log('Exportar datos');
  }

  getOperadorInitials(operador: OperadorResponse): string {
    const nombre = operador.nombre || '';
    return nombre.substring(0, 2).toUpperCase();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Estados vacíos
  getEmptyStateTitle(): string {
    if (this.searchQuery) {
      return 'No se encontraron resultados';
    }
    return 'No hay operadores registrados';
  }

  getEmptyStateMessage(): string {
    if (this.searchQuery) {
      return `No hay resultados para "${this.searchQuery}". Intenta con otros términos de búsqueda.`;
    }
    return 'Comienza creando tu primer operador. Puedes agregar operadores turísticos, aerolíneas, hoteles, etc.';
  }

  hasActiveFilters(): boolean {
    return !!this.searchQuery;
  }

  clearAllFilters(): void {
    this.searchQuery = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  // Métodos de validación
  isFieldInvalid(fieldName: string): boolean {
    const field = this.operadorForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.operadorForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return 'Este campo es obligatorio';
      }
      if (field.errors['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['maxlength']) {
        return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Manejo de errores
  private showError(message: string): void {
    this.errorMessage = message;
    this.showErrorModal = true;
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
    this.errorMessage = '';
  }

  // Métodos del Sidebar
  onSidebarItemClick(item: SidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  // Listener para cerrar menús
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.action-menu-container') && !target.closest('.dropdown-menu')) {
      this.closeAllMenus();
    }
  }

  // Método para trackBy en ngFor
  trackByOperadorId(index: number, operador: OperadorResponse): number {
    return operador.id;
  }
}