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
import { ModuleCardComponent, ModuleCardData } from '../../shared/components/ui/module-card/module-card.component';

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
    ErrorModalComponent,
    ModuleCardComponent
  ]
})
export class FormaPagoComponent implements OnInit {

  // Sidebar Configuration
  sidebarCollapsed = false;
  allSidebarMenuItems: ExtendedSidebarMenuItem[] = [
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
      moduleKey: 'CLIENTES',
      children: [
        {
          id: 'personas',
          title: 'Clientes',
          icon: 'fas fa-address-card',
          route: '/personas',
          moduleKey: 'PERSONAS'
        },
        {
          id: 'viajeros',
          title: 'Viajeros',
          icon: 'fas fa-passport',
          route: '/viajero',
          moduleKey: 'VIAJEROS'
        },
        {
          id: 'viajeros-frecuentes',
          title: 'Viajeros Frecuentes',
          icon: 'fas fa-crown',
          route: '/viajero-frecuente',
          moduleKey: 'VIAJEROS'
        }
      ]
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
      id: 'recursos',
      title: 'Recursos',
      icon: 'fas fa-box',
      active: true,
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
          id: 'formas-pago',
          title: 'Forma De Pago',
          icon: 'fas fa-money-bill-wave',
          route: '/formas-pago',
          active: true,
          moduleKey: 'FORMAS_PAGO'
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
          id: 'counters',
          title: 'Counters',
          icon: 'fas fa-users-line',
          route: '/counters',
          moduleKey: 'COUNTERS'
        },
        {
          id: 'sucursales',
          title: 'Sucursales',
          icon: 'fas fa-building',
          route: '/sucursales',
          moduleKey: 'SUCURSALES'
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
          route: '/carpetas',
          moduleKey: 'CARPETAS'
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

  onSidebarItemClick(event: any): void {
    // Manejar clicks en sidebar si es necesario
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
    this.applyFilters();
  }

  applyFilters(): void {
    const q = this.searchQuery?.trim().toLowerCase();
    if (!q) {
      this.formasPagoFiltradas = [...this.formasPago];
    } else {
      this.formasPagoFiltradas = this.formasPago.filter(f => {
        const desc = (f.descripcion || '').toString().toLowerCase();
        const cod = (f.codigo !== undefined && f.codigo !== null) ? f.codigo.toString() : '';
        return desc.includes(q) || cod.includes(q) || (f.id && f.id.toString().includes(q));
      });
    }
    this.totalItems = this.formasPagoFiltradas.length;
  }

  hasActiveFilters(): boolean {
    return this.searchQuery?.trim().length > 0;
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
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.formasPago = [];
        this.totalFormasPago = 0;
        this.loading = false;
        this.showError('Error al cargar las formas de pago');
      }
    });
  }

  // =================================================================
  // PAGINATION
  // =================================================================

  get paginatedFormasPago(): FormaPagoResponse[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.formasPagoFiltradas.slice(start, end);
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

  openEditModal(formaPago: FormaPagoResponse): void {
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
        this.closeModal();
        this.loadFormasPago();
        this.loading = false;
      },
      error: (error) => {
        const { modalData } = this.errorHandler.handleHttpError(error, 'guardar forma de pago');
        this.showError(modalData.message);
        this.loading = false;
      }
    });
  }

  // Eliminar forma de pago
  confirmDelete(formaPago: FormaPagoResponse): void {
    this.formaPagoToDelete = formaPago;
    this.showConfirmModal = true;
  }

  executeDelete(): void {
    if (this.formaPagoToDelete) {
      this.loading = true;
      const id = this.formaPagoToDelete.id;

      this.formaPagoService.deleteByIdFormaPago(id).subscribe({
        next: () => {
          this.loadFormasPago();
          this.closeConfirmModal();
          this.selectedItems = this.selectedItems.filter(i => i !== id);
        },
        error: (error) => {
          const { modalData } = this.errorHandler.handleHttpError(error, 'eliminar forma de pago');
          this.showError(modalData.message);
          this.loading = false;
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

  showError(message: string): void {
    this.errorMessage = message;
    this.showErrorModal = true;
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
    this.errorMessage = '';
  }
}
