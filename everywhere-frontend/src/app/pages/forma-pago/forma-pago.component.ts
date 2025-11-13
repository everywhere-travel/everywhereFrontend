import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormaPagoService } from '../../core/service/FormaPago/forma-pago.service';
import { FormaPagoRequest, FormaPagoResponse } from '../../shared/models/FormaPago/formaPago.model';
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';
import { ErrorModalComponent } from '../../shared/components/error-modal/error-modal.component';
import { ErrorHandlerService } from '../../shared/services/error-handler.service';
import { AuthServiceService } from '../../core/service/auth/auth.service';
import { ModuleCardData } from '../../shared/components/ui/module-card/module-card.component';

// Interfaz para tabla de formas de pago
export interface FormaPagoTabla {
  id?: number;
  codigo?: string;
  descripcion?: string;
  creado?: string;
  actualizado?: string;
}

// Extender la interfaz para agregar moduleKey
interface ExtendedSidebarMenuItem extends SidebarMenuItem {
  moduleKey?: string;
  children?: ExtendedSidebarMenuItem[];
}

@Component({
  selector: 'app-forma-pago',
  standalone: true,
  templateUrl: './forma-pago.component.html',
  styleUrls: ['./forma-pago.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SidebarComponent,
    ErrorModalComponent
  ]
})
export class FormaPagoComponent implements OnInit {

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

  // Formulario
  formaPagoForm!: FormGroup;

  // Variables de control
  loading: boolean = false;
  isLoading: boolean = false;
  searchQuery: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  sortColumn: string = 'descripcion';

  // Variables de control para las vistas
  currentView: 'table' | 'cards' | 'list' = 'table';

  // Variables para modales
  showModal: boolean = false;
  isEditMode: boolean = false;
  editingId: number | null = null;
  showConfirmModal: boolean = false;
  formaPagoToDelete: FormaPagoResponse | null = null;
  showErrorModal: boolean = false;
  errorMessage: string = '';

  // Alert messages
  errorAlertMessage: string = '';
  successAlertMessage: string = '';
  showErrorAlert: boolean = false;
  showSuccessAlert: boolean = false;

  // Variables para menú de acciones
  showActionMenu: number | null = null;
  showActionMenuCards: number | null = null;
  showActionMenuList: number | null = null;
  showQuickActions: number | null = null;

  // Variables para selección múltiple
  selectedItems: number[] = [];
  allSelected: boolean = false;
  someSelected: boolean = false;

  // Estadísticas
  totalFormasPago = 0;

  // Math object for template use
  Math = Math;

  // Variables para paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Datos
  formasPago: FormaPagoResponse[] = [];
  formaPagoTabla: FormaPagoTabla[] = [];
  filteredFormasPago: FormaPagoTabla[] = [];
  formasPagoFiltradas: FormaPagoResponse[] = [];

  constructor(
    private fb: FormBuilder,
    private formaPagoService: FormaPagoService,
    private router: Router,
    private authService: AuthServiceService,
    private errorHandler: ErrorHandlerService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.initializeSidebar();
    this.loadFormasPago();
  }

  // =================================================================
  // SIDEBAR FILTERING
  // =================================================================

  private initializeSidebar(): void {
    const authData = this.authService.getUser();
    const userPermissions = authData?.permissions || {};

    if (userPermissions['ALL_MODULES']) {
      this.sidebarMenuItems = this.allSidebarMenuItems;
    } else {
      this.sidebarMenuItems = this.filterSidebarItems(this.allSidebarMenuItems, userPermissions);
    }
  }

  private filterSidebarItems(items: ExtendedSidebarMenuItem[], userPermissions: any): ExtendedSidebarMenuItem[] {
    return items.filter(item => {
      if (item.id === 'dashboard') {
        return true;
      }

      if (!item.moduleKey) {
        if (item.children) {
          const filteredChildren = this.filterSidebarItems(item.children, userPermissions);
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

      const hasPermission = Object.keys(userPermissions).includes(item.moduleKey);

      if (hasPermission) {
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
      if (item.children) {
        return {
          ...item,
          children: this.filterSidebarItems(item.children, userPermissions)
        };
      }
      return item;
    }).filter(item => {
      if (item.children) {
        return item.children.length > 0;
      }
      return true;
    }) as ExtendedSidebarMenuItem[];
  }

  // =================================================================
  // SIDEBAR EVENTS
  // =================================================================

  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: ExtendedSidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  // =================================================================
  // VIEW MANAGEMENT
  // =================================================================

  changeView(view: 'table' | 'cards' | 'list'): void {
    this.currentView = view;
  }

  isActiveView(view: 'table' | 'cards' | 'list'): boolean {
    return this.currentView === view;
  }

  // =================================================================
  // SEARCH & FILTER
  // =================================================================

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.formaPagoTabla];

    // Filtro por búsqueda
    const term = this.searchQuery?.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter(forma => {
        const searchableText = `${forma.descripcion} ${forma.codigo}`.toLowerCase();
        return searchableText.includes(term);
      });
    }

    this.filteredFormasPago = filtered;
    this.totalItems = filtered.length;

    // Aplicar ordenamiento
    this.applySorting();
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
    if (!this.filteredFormasPago.length) return;

    this.filteredFormasPago.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (this.sortColumn) {
        case 'codigo':
          valueA = a.codigo?.toLowerCase() || '';
          valueB = b.codigo?.toLowerCase() || '';
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

  hasActiveFilters(): boolean {
    return this.searchQuery?.trim().length > 0;
  }

  refreshData(): void {
    this.loadFormasPago();
  }

  // =================================================================
  // DATA LOADING
  // =================================================================

  private initializeForm(): void {
    this.formaPagoForm = this.fb.group({
      codigo: [null],
      descripcion: ['', [Validators.required, Validators.maxLength(200)]]
    });
  }

  loadFormasPago(): void {
    this.loading = true;
    this.formaPagoService.getAllFormasPago().subscribe({
      next: (res) => {
        this.formasPago = res || [];
        this.totalFormasPago = this.formasPago.length;

        // Convertir a FormaPagoTabla para filtrado y ordenamiento
        this.formaPagoTabla = this.formasPago.map(f => ({
          id: f.id,
          codigo: f.codigo ? f.codigo.toString() : undefined,
          descripcion: f.descripcion,
          creado: f.fechaCreacion ? new Date(f.fechaCreacion).toISOString() : undefined,
          actualizado: f.fechaActualizacion ? new Date(f.fechaActualizacion).toISOString() : undefined
        }));

        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.formasPago = [];
        this.formaPagoTabla = [];
        this.totalFormasPago = 0;
        this.loading = false;
        this.showError('Error al cargar las formas de pago');
      }
    });
  }

  // =================================================================
  // PAGINATION
  // =================================================================

  get paginatedFormasPago(): FormaPagoTabla[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredFormasPago.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxButtons = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(this.totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // =================================================================
  // MODAL CRUD
  // =================================================================

  openCreateModal(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.formaPagoForm.reset();
    this.showModal = true;
  }

  openEditModal(formaPago: FormaPagoResponse | undefined): void {
    if (!formaPago) return;
    this.isEditMode = true;
    this.editingId = formaPago.id;
    this.formaPagoForm.patchValue({
      codigo: formaPago.codigo,
      descripcion: formaPago.descripcion
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.formaPagoForm.reset();
    this.isEditMode = false;
    this.editingId = null;
  }

  saveFormaPago(): void {
    if (this.formaPagoForm.invalid) return;

    this.loading = true;
    const payload: FormaPagoRequest = {
      codigo: this.formaPagoForm.value.codigo,
      descripcion: this.formaPagoForm.value.descripcion
    };

    const request = this.isEditMode && this.editingId
      ? this.formaPagoService.updateByIdFormaPago(this.editingId, payload)
      : this.formaPagoService.saveFormaPago(payload);

    request.subscribe({
      next: () => {
        this.showSuccess(this.isEditMode ? 'Forma de pago actualizada correctamente' : 'Forma de pago creada correctamente');
        this.closeModal();
        this.loadFormasPago();
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        const errorMessage = error?.error?.detail ||
                            error?.error?.message ||
                            error?.message ||
                            'Error al guardar forma de pago';
        this.showError(errorMessage);
      }
    });
  }

  // Eliminar forma de pago
  confirmDelete(formaPago: FormaPagoResponse | undefined): void {
    if (!formaPago) return;
    this.formaPagoToDelete = formaPago;
    this.showConfirmModal = true;
  }

  executeDelete(): void {
    if (this.formaPagoToDelete) {
      this.loading = true;
      const id = this.formaPagoToDelete.id;

      this.formaPagoService.deleteByIdFormaPago(id).subscribe({
        next: () => {
          this.showSuccess('Forma de pago eliminada correctamente');
          this.loadFormasPago();
          this.closeConfirmModal();
          this.selectedItems = this.selectedItems.filter(i => i !== id);
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          const errorMessage = error?.error?.detail ||
                              error?.error?.message ||
                              error?.message ||
                              'Error al eliminar forma de pago';
          this.showError(errorMessage);
        }
      });
    }
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.formaPagoToDelete = null;
  }

  // =================================================================
  // HELPERS
  // =================================================================

  formatDate(d?: string | Date | undefined): string {
    if (!d) return '-';
    const date = d instanceof Date ? d : new Date(d as string);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString();
  }

  getFormaPagoById(id?: number): FormaPagoResponse | undefined {
    return this.formasPago.find(f => f.id === id);
  }

  convertToModuleCard(f: FormaPagoResponse): ModuleCardData {
    return {
      title: f.descripcion || `Forma ${f.id}`,
      description: f.codigo ? `Código: ${f.codigo}` : 'Sin código',
      route: `/formas-pago`,
      icon: 'fas fa-money-bill-wave',
      iconType: 'documentos',
      moduleKey: 'FORMAS_PAGO',
      featured: false
    } as ModuleCardData;
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
    this.errorMessage = '';
  }

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
