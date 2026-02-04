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
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { DataTableConfig } from '../../shared/components/data-table/data-table.config';

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
    ErrorModalComponent,
    DataTableComponent
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

  // Control variables
  loading = false;
  isLoading: boolean = false;
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

  // Estadísticas
  totalEstadoCotizacion = 0;

  tableConfig: DataTableConfig<EstadoCotizacionTabla> = {
    data: [],
    columns: [
      {
        key: 'descripcion',
        header: 'Descripción',
        icon: 'fa-align-left',
        sortable: true,
        render: (item) => item.descripcion || 'Sin descripción'
      },
      {
        key: 'creado',
        header: 'Fecha Creación',
        icon: 'fa-calendar-plus',
        sortable: true,
        width: '150px',
        render: (item) => this.formatDate(item.creado)
      },
      {
        key: 'actualizado',
        header: 'Última Actualización',
        icon: 'fa-calendar-check',
        sortable: true,
        width: '180px',
        render: (item) => this.formatDate(item.actualizado)
      }
    ],
    enableSearch: true,
    searchPlaceholder: 'Buscar por descripción...',
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
        handler: (item) => this.editarEstadoCotizacion(item)
      },
      {
        icon: 'fa-trash',
        label: 'Eliminar',
        color: 'red',
        handler: (item) => this.eliminarEstadoCotizacion(item.id)
      }
    ],
    emptyMessage: 'No se encontraron estados de cotización',
    loadingMessage: 'Cargando estados...',
    defaultView: 'table',
    enableRowHover: true,
    trackByKey: 'id'
  };

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
    this.isLoading = true;
    this.estadoCotizacionService.getAllEstadosCotizacion().subscribe({
      next: (estadosCotizacion) => {
        this.estadosCotizacion = estadosCotizacion;
        this.convertirATabla();
        this.totalEstadoCotizacion = this.EstadoCotizacionTabla.length;
        // Actualizar la configuración del DataTable con los nuevos datos
        this.tableConfig = {
          ...this.tableConfig,
          data: this.EstadoCotizacionTabla
        };
        this.loading = false;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar estados de cotización:', error);
        this.loading = false;
        this.isLoading = false;
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

  refreshData(): void {
    this.loadEstadosCotizacion();
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
