import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoriaPersonaService } from '../../core/service/CategoriaPersona/categoria-persona.service';
import { CategoriaPersonaRequest, CategoriaPersonaResponse } from '../../shared/models/CategoriaPersona/categoriaPersona.models';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ErrorModalComponent, ErrorModalData, BackendErrorResponse } from '../../shared/components/error-modal/error-modal.component';
import { ErrorHandlerService } from '../../shared/services/error-handler.service';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { DataTableConfig } from '../../shared/components/data-table/data-table.config';

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
    ErrorModalComponent,
    DataTableComponent
  ]
})
export class CategoriaPersonaComponent implements OnInit {

  // Sidebar Configuration
  sidebarCollapsed = false;
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

  // Forms
  categoriaPersonaForm!: FormGroup;

  // Data arrays
  categoriasPersona: CategoriaPersonaResponse[] = [];
  categoriaPersonaTabla: CategoriaPersonaTabla[] = [];

  // Control variables
  loading = false;
  isLoading: boolean = false;
  mostrarModalCrear = false;
  mostrarModalEliminar = false;
  mostrarModalError = false;
  editandoCategoriaPersona = false;
  categoriaPersonaSeleccionada: CategoriaPersonaResponse | null = null;
  categoriaPersonaAEliminar: CategoriaPersonaResponse | null = null;

  // Error modal data
  errorModalData: ErrorModalData | null = null;
  backendErrorData: BackendErrorResponse | null = null;

  // Estadísticas
  totalCategoriaPersona = 0;

  tableConfig: DataTableConfig<CategoriaPersonaTabla> = {
    data: [],
    columns: [
      {
        key: 'nombre',
        header: 'Categoría',
        icon: 'fa-tag',
        sortable: true
      },
      {
        key: 'descripcion',
        header: 'Descripción',
        icon: 'fa-align-left',
        sortable: true,
        render: (item) => item.descripcion || '-'
      },
      {
        key: 'creado',
        header: 'Fecha de Creación',
        icon: 'fa-calendar-plus',
        sortable: true,
        render: (item) => this.formatDateTime(item.creado)
      },
      {
        key: 'actualizado',
        header: 'Última Actualización',
        icon: 'fa-calendar-check',
        sortable: true,
        render: (item) => this.formatDateTime(item.actualizado)
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
        handler: (item) => this.editarCategoriaPersona(item)
      },
      {
        icon: 'fa-trash',
        label: 'Eliminar',
        color: 'red',
        handler: (item) => this.eliminarCategoriaPersona(item.id)
      }
    ],
    bulkActions: [
      {
        icon: 'fa-trash',
        label: 'Eliminar seleccionados',
        color: 'red',
        handler: (items) => this.onEliminarMasivo(items.map(i => i.id)),
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
    private categoriaPersonaService: CategoriaPersonaService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private menuConfigService: MenuConfigService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/categorias-persona');
    this.loadCategoriasPersona();
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
    this.tableConfig = {
      ...this.tableConfig,
      data: this.categoriaPersonaTabla
    };
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

  onEliminarMasivo(ids: number[]): void {
    if (ids.length === 0) return;

    const confirmMessage = `¿Está seguro de eliminar ${ids.length} categoría${ids.length > 1 ? 's' : ''}?\n\nEsta acción no se puede deshacer.`;
    if (confirm(confirmMessage)) {
      this.loading = true;
      let eliminados = 0;
      const total = ids.length;

      ids.forEach(id => {
        this.categoriaPersonaService.deleteById(id).subscribe({
          next: () => {
            eliminados++;
            if (eliminados === total) {
              this.loadCategoriasPersona();
              this.loading = false;
            }
          },
          error: (error) => {
            console.error('Error al eliminar categoría:', error);
            eliminados++;
            if (eliminados === total) {
              this.loadCategoriasPersona();
              this.loading = false;
            }
          }
        });
      });
    }
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

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).toUpperCase();
  }
}
