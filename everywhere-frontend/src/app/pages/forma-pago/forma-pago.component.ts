import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { FormaPagoService } from '../../core/service/FormaPago/forma-pago.service';
import { FormaPagoRequest, FormaPagoResponse } from '../../shared/models/FormaPago/formaPago.model';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ErrorModalComponent } from '../../shared/components/error-modal/error-modal.component';
import { ErrorHandlerService } from '../../shared/services/error-handler.service';
import { ModuleCardData } from '../../shared/components/ui/module-card/module-card.component';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';

import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { DataTableConfig } from '../../shared/components/data-table/data-table.config';

// Interfaz para tabla de formas de pago
export interface FormaPagoTabla {
  id?: number;
  codigo?: string;
  descripcion?: string;
  creado?: string;
  actualizado?: string;
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
    DataTableComponent
  ]
})
export class FormaPagoComponent implements OnInit {

  // Sidebar Configuration
  sidebarCollapsed = false;
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

  // Formulario
  formaPagoForm!: FormGroup;

  // Variables de control
  loading: boolean = false;
  isLoading: boolean = false;

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

  // Estadísticas
  totalFormasPago = 0;

  // Datos
  formasPago: FormaPagoResponse[] = [];
  formaPagoTabla: FormaPagoTabla[] = [];

  tableConfig: DataTableConfig<FormaPagoTabla> = {
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
    searchPlaceholder: 'Buscar por código o descripción...',
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
        handler: (item) => {
          const formaPago = this.getFormaPagoById(item.id);
          this.openEditModal(formaPago);
        }
      },
      {
        icon: 'fa-trash',
        label: 'Eliminar',
        color: 'red',
        handler: (item) => {
          const formaPago = this.getFormaPagoById(item.id);
          this.confirmDelete(formaPago);
        }
      }
    ],
    emptyMessage: 'No se encontraron formas de pago',
    loadingMessage: 'Cargando formas de pago...',
    defaultView: 'table',
    enableRowHover: true,
    trackByKey: 'id'
  };

  constructor(
    private fb: FormBuilder,
    private formaPagoService: FormaPagoService,
    private router: Router,
    private menuConfigService: MenuConfigService,
    private errorHandler: ErrorHandlerService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/formas-pago');
    this.loadFormasPago();
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
    this.isLoading = true;
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

        // Actualizar la configuración del DataTable con los nuevos datos
        this.tableConfig = {
          ...this.tableConfig,
          data: this.formaPagoTabla
        };

        this.loading = false;
        this.isLoading = false;
      },
      error: () => {
        this.formasPago = [];
        this.formaPagoTabla = [];
        this.totalFormasPago = 0;
        this.loading = false;
        this.isLoading = false;
        this.showError('Error al cargar las formas de pago');
      }
    });
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
