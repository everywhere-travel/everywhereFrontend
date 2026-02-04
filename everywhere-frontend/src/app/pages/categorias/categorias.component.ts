import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoriaService } from '../../core/service/Categoria/categoria.service';
import { CategoriaRequest, CategoriaResponse } from '../../shared/models/Categoria/categoria.model';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ErrorModalComponent } from '../../shared/components/error-modal/error-modal.component';
import { ErrorHandlerService } from '../../shared/services/error-handler.service';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { DataTableConfig } from '../../shared/components/data-table/data-table.config';

// Interfaz para tabla de categorías
export interface CategoriaTabla {
  id?: number;
  nombre?: string;
  creado?: string;
  actualizado?: string;
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
    ErrorModalComponent,
    DataTableComponent
  ]
})
export class CategoriasComponent implements OnInit {

  // Sidebar Configuration
  sidebarCollapsed = false;
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

  // Estadísticas
  totalCategorias = 0;

  // Para DataTable
  isLoading: boolean = false;

  tableConfig: DataTableConfig<CategoriaTabla> = {
    data: [],
    columns: [
      {
        key: 'nombre',
        header: 'Categoría',
        icon: 'fa-tag',
        sortable: true
      },
      {
        key: 'creado',
        header: 'Fecha de Creación',
        icon: 'fa-calendar-plus',
        sortable: true,
        render: (item: CategoriaTabla) => this.formatDateTime(item.creado)
      },
      {
        key: 'actualizado',
        header: 'Última Actualización',
        icon: 'fa-calendar-check',
        sortable: true,
        render: (item: CategoriaTabla) => this.formatDateTime(item.actualizado)
      }
    ],
    enableSearch: true,
    searchPlaceholder: 'Buscar por nombre...',
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
        handler: (item: CategoriaTabla) => this.openEditModal(this.getCategoriaById(item.id))
      },
      {
        icon: 'fa-trash',
        label: 'Eliminar',
        color: 'red',
        handler: (item: CategoriaTabla) => this.confirmDelete(this.getCategoriaById(item.id)),
        disabled: (item: CategoriaTabla) => item.id === 1
      }
    ],
    bulkActions: [
      {
        icon: 'fa-trash',
        label: 'Eliminar seleccionados',
        color: 'red',
        handler: (items: CategoriaTabla[]) => this.onEliminarMasivo(items.map((i: CategoriaTabla) => i.id!).filter((id: number) => id !== undefined)),
        confirm: {
          title: 'Eliminar múltiples categorías',
          message: 'Esta acción no se puede deshacer'
        }
      }
    ],
    emptyMessage: 'No se encontraron categorías',
    loadingMessage: 'Cargando categorías...',
    defaultView: 'table',
    enableRowHover: true,
    trackByKey: 'id'
  };

  constructor(
    private fb: FormBuilder,
    private categoriaService: CategoriaService,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private menuConfigService: MenuConfigService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/categorias');
    this.loadCategorias();
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
          creado: c.creado ? new Date(c.creado).toISOString() : undefined,
          actualizado: c.actualizado ? new Date(c.actualizado).toISOString() : undefined
        }));

        this.filteredCategorias = [...this.categoriasTabla];
        this.updateTableConfig();
        this.loading = false;
      },
      error: () => {
        this.categorias = [];
        this.categoriasTabla = [];
        this.filteredCategorias = [];
        this.totalCategorias = 0;
        this.updateTableConfig();
        this.loading = false;
        this.showError('Error al cargar las categorías');
      }
    });
  }

  private updateTableConfig(): void {
    this.tableConfig = {
      ...this.tableConfig,
      data: this.categoriasTabla
    };
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

  onEliminarMasivo(ids: number[]): void {
    if (ids.length === 0) return;

    // Filtrar ID 1 (categoría por defecto)
    const idsToDelete = ids.filter(id => id !== 1);
    if (idsToDelete.length === 0) {
      this.showError('No es posible eliminar la categoría por defecto');
      return;
    }

    this.loading = true;
    let eliminados = 0;
    const total = idsToDelete.length;

    idsToDelete.forEach(id => {
      this.categoriaService.delete(id).subscribe({
        next: () => {
          eliminados++;
          if (eliminados === total) {
            this.showSuccess(`${eliminados} categoría(s) eliminada(s) correctamente`);
            this.loadCategorias();
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Error al eliminar categoría:', error);
          eliminados++;
          if (eliminados === total) {
            this.loadCategorias();
            this.loading = false;
          }
        }
      });
    });
  }

  // =================================================================
  // HELPERS
  // =================================================================

  formatDateTime(d?: string | Date | undefined): string {
    if (!d) return '-';
    const date = d instanceof Date ? d : new Date(d as string);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getCategoriaById(id?: number): CategoriaResponse | undefined {
    return this.categorias.find(c => c.id === id);
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
