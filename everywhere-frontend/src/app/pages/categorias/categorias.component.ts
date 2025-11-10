import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoriaService } from '../../core/service/Categoria/categoria.service';
import { CategoriaRequest, CategoriaResponse } from '../../shared/models/Categoria/categoria.model';
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';
import { ErrorModalComponent } from '../../shared/components/error-modal/error-modal.component';
import { ErrorHandlerService } from '../../shared/services/error-handler.service';
import { AuthServiceService } from '../../core/service/auth/auth.service';
import { ModuleCardData } from '../../shared/components/ui/module-card/module-card.component';

// Interfaz para tabla de categorías
export interface CategoriaTabla {
  id?: number;
  nombre?: string;
  creado?: string;
  actualizado?: string;
}

interface ExtendedSidebarMenuItem extends SidebarMenuItem {
  moduleKey?: string;
  children?: ExtendedSidebarMenuItem[];
}

@Component({
  selector: 'app-categorias',
  standalone: true,
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SidebarComponent,
    ErrorModalComponent
  ]
})
export class CategoriasComponent implements OnInit {

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
          title: 'Categorias de Persona',
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

  // Datos
  categorias: CategoriaResponse[] = [];
  categoriasTabla: CategoriaTabla[] = [];
  filteredCategorias: CategoriaTabla[] = [];

  // Formulario
  categoriaForm!: FormGroup;

  // Control variables
  loading: boolean = false;
  showModal: boolean = false;
  isEditMode: boolean = false;
  editingId: number | null = null;
  showConfirmModal: boolean = false;
  categoriaToDelete: CategoriaResponse | null = null;
  showErrorModal: boolean = false;
  errorMessage: string = '';

  // Alert messages
  errorAlertMessage: string = '';
  successAlertMessage: string = '';
  showErrorAlert: boolean = false;
  showSuccessAlert: boolean = false;

  // Search and Filter
  searchTerm: string = '';
  currentView: 'table' | 'cards' | 'list' = 'table';

  // Sorting variables
  sortColumn: string = 'creado';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Estadísticas
  totalCategorias = 0;

  // Math object for template use
  Math = Math;

  constructor(
    private fb: FormBuilder,
    private categoriaService: CategoriaService,
    private router: Router,
    private authService: AuthServiceService,
    private errorHandler: ErrorHandlerService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.initializeSidebar();
    this.loadCategorias();
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
    this.searchTerm = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.categoriasTabla];

    // Filtro por búsqueda
    const term = this.searchTerm?.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter(categoria => {
        const searchableText = `${categoria.nombre}`.toLowerCase();
        return searchableText.includes(term);
      });
    }

    this.filteredCategorias = filtered;
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
    if (!this.filteredCategorias.length) return;

    this.filteredCategorias.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (this.sortColumn) {
        case 'nombre':
          valueA = a.nombre?.toLowerCase() || '';
          valueB = b.nombre?.toLowerCase() || '';
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
    return this.searchTerm?.trim().length > 0;
  }

  // =================================================================
  // DATA LOADING
  // =================================================================

  private initializeForm(): void {
    this.categoriaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(200)]]
    });
  }

  loadCategorias(): void {
    this.loading = true;
    this.categoriaService.findAll().subscribe({
      next: (res) => {
        this.categorias = res || [];
        this.totalCategorias = this.categorias.length;

        // Convertir a CategoriaTabla para filtrado y ordenamiento
        this.categoriasTabla = this.categorias.map(c => ({
          id: c.id,
          nombre: c.nombre,
          creado: c.fechaCreacion ? new Date(c.fechaCreacion).toISOString() : undefined,
          actualizado: c.fechaActualizacion ? new Date(c.fechaActualizacion).toISOString() : undefined
        }));

        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.categorias = [];
        this.categoriasTabla = [];
        this.totalCategorias = 0;
        this.loading = false;
        this.showError('Error al cargar las categorías');
      }
    });
  }

  // =================================================================
  // PAGINATION
  // =================================================================

  get paginatedCategorias(): CategoriaTabla[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredCategorias.slice(start, end);
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
    this.categoriaForm.reset();
    this.showModal = true;
  }

  openEditModal(categoria: CategoriaResponse | undefined): void {
    if (!categoria) return;
    this.isEditMode = true;
    this.editingId = categoria.id || null;
    this.categoriaForm.patchValue({
      nombre: categoria.nombre
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.categoriaForm.reset();
    this.isEditMode = false;
    this.editingId = null;
  }

  saveCategoria(): void {
    if (this.categoriaForm.invalid) return;

    this.loading = true;
    const payload: CategoriaRequest = {
      nombre: this.categoriaForm.value.nombre
    };

    const request = this.isEditMode && this.editingId
      ? this.categoriaService.update(this.editingId, payload)
      : this.categoriaService.create(payload);

    request.subscribe({
      next: () => {
        this.showSuccess(this.isEditMode ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente');
        this.closeModal();
        this.loadCategorias();
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        const errorMessage = error?.error?.detail ||
                            error?.error?.message ||
                            error?.message ||
                            'Error al guardar categoría';
        this.showError(errorMessage);
      }
    });
  }

  // Eliminar categoría
  confirmDelete(categoria: CategoriaResponse | undefined): void {
    if (!categoria) return;
    // Validar que no sea la categoría por defecto (ID: 1)
    if (categoria.id === 1) {
      this.showError('No es posible eliminar la categoría por defecto');
      return;
    }
    this.categoriaToDelete = categoria;
    this.showConfirmModal = true;
  }

  executeDelete(): void {
    if (this.categoriaToDelete && this.categoriaToDelete.id) {
      this.loading = true;
      const id = this.categoriaToDelete.id;

      this.categoriaService.delete(id).subscribe({
        next: () => {
          this.showSuccess('Categoría eliminada correctamente');
          this.loadCategorias();
          this.closeConfirmModal();
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          const errorMessage = error?.error?.detail ||
                              error?.error?.message ||
                              error?.message ||
                              'Error al eliminar categoría';
          this.showError(errorMessage);
        }
      });
    }
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.categoriaToDelete = null;
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

  getCategoriaById(id?: number): CategoriaResponse | undefined {
    return this.categorias.find(c => c.id === id);
  }

  convertToModuleCard(c: CategoriaResponse): ModuleCardData {
    return {
      title: c.nombre || `Categoría ${c.id}`,
      description: `ID: ${c.id}`,
      route: `/categorias`,
      icon: 'fas fa-tags',
      iconType: 'documentos',
      moduleKey: 'CATEGORIAS',
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
