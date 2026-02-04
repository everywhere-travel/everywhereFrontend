import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DocumentoService } from '../../core/service/Documento/documento.service';
import { DocumentoRequest } from '../../shared/models/Documento/documento.model';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';

import { ErrorModalComponent, ErrorModalData, BackendErrorResponse } from '../../shared/components/error-modal/error-modal.component';
import { ErrorHandlerService } from '../../shared/services/error-handler.service';
import { ModuleCardComponent, ModuleCardData } from '../../shared/components/ui/module-card/module-card.component';
import { StatusIndicatorComponent, StatusData } from '../../shared/components/ui/status-indicator/status-indicator.component';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { DataTableConfig } from '../../shared/components/data-table/data-table.config';

// Interface para la tabla de documentos
export interface DocumentoTabla {
  id: number;
  tipo: string;
  descripcion: string;
  estado: boolean;
  creado: string;
  actualizado: string;
}

@Component({
  selector: 'app-documentos',
  standalone: true,
  templateUrl: './documentos.component.html',
  styleUrls: ['./documentos.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SidebarComponent,
    ErrorModalComponent,
    ModuleCardComponent,
    DataTableComponent
  ]
})
export class DocumentosComponent implements OnInit {

  // Sidebar Configuration
  sidebarCollapsed = false;
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];


  // Estado general
  loading = false;
  isLoading: boolean = false;
  documentos: DocumentoTabla[] = [];
  totalDocumentos = 0;

  // Modales
  mostrarModalCrear = false;
  mostrarModalEliminar = false;
  mostrarModalError = false;
  mostrarModalConfirmacion = false;

  // Formularios
  documentoForm!: FormGroup;
  editandoDocumento = false;
  editingDocumentoId: number | null = null;
  originalDocumento: DocumentoTabla | null = null;
  documentoAEliminar: DocumentoTabla | null = null;
  documentoAConfirmar: DocumentoTabla | null = null;
  accionConfirmacion: 'activar' | 'desactivar' = 'activar';

  // Error handling
  errorModalData: ErrorModalData = {
    title: '',
    message: ''
  };
  backendErrorData: BackendErrorResponse | null = null;

  // Tipo mappings
  tipoOptions = [
    { value: 'PASAPORTE', label: 'PASAPORTE' },
    { value: 'DNI', label: 'DNI' },
    { value: 'CEDULA', label: 'CEDULA' },
    { value: 'VISA', label: 'VISA' },
    { value: 'LICENCIA', label: 'LICENCIA' },
    { value: 'OTRO', label: 'OTRO' }
  ];

  // ===== Configuración del DataTable =====
  tableConfig: DataTableConfig<DocumentoTabla> = {
    data: [],
    columns: [
      {
        key: 'tipo',
        header: 'Tipo de Documento',
        icon: 'fa-file-alt',
        sortable: true,
        align: 'center',
        width: '150px',
        render: (item) => this.getTipoLabel(item.tipo)
      },
      {
        key: 'descripcion',
        header: 'Descripción',
        icon: 'fa-align-left',
        sortable: true,
        render: (item) => item.descripcion || 'Sin descripción'
      },
      {
        key: 'estado',
        header: 'Estado',
        icon: 'fa-toggle-on',
        sortable: true,
        align: 'center',
        width: '100px',
        render: (item) => item.estado ? 'Activo' : 'Inactivo'
      },
      {
        key: 'creado',
        header: 'Fecha Creación',
        icon: 'fa-calendar-plus',
        sortable: true,
        width: '120px',
        render: (item) => this.formatDate(item.creado)
      },
      {
        key: 'actualizado',
        header: 'Última Actualización',
        icon: 'fa-calendar-check',
        sortable: true,
        width: '150px',
        render: (item) => this.formatDate(item.actualizado)
      }
    ],
    enableSearch: true,
    searchPlaceholder: 'Buscar por tipo, descripción...',
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
        handler: (item) => this.editarDocumento(item)
      },
      {
        icon: 'fa-toggle-on',
        label: 'Cambiar Estado',
        color: 'yellow',
        handler: (item) => this.onCardAction(item)
      },
      {
        icon: 'fa-trash',
        label: 'Eliminar',
        color: 'red',
        handler: (item) => this.eliminarDocumento(item.id)
      }
    ],

    emptyMessage: 'No se encontraron tipos de documentos',
    loadingMessage: 'Cargando documentos...',
    defaultView: 'table',
    enableRowHover: true,
    trackByKey: 'id'
  };

  constructor(
    private documentoService: DocumentoService,
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private menuConfigService: MenuConfigService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/documentos');
    this.cargarDocumentos();
  }

  private initializeForm(): void {
    this.documentoForm = this.fb.group({
      tipo: ['', [Validators.required]],
      descripcion: ['', [Validators.maxLength(500)]]
    });
  }

  // Sidebar methods
  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: ExtendedSidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  // Data loading
  cargarDocumentos(): void {
    this.loading = true;
    this.isLoading = true;
    this.documentoService.getAllDocumentos().subscribe({
      next: (documentos) => {
        this.documentos = documentos.map(doc => ({
          id: doc.id,
          tipo: doc.tipo,
          descripcion: doc.descripcion || '',
          estado: doc.estado,
          creado: doc.creado,
          actualizado: doc.actualizado
        }));
        this.totalDocumentos = this.documentos.length;
        // Actualizar la configuración del DataTable con los nuevos datos
        this.tableConfig = {
          ...this.tableConfig,
          data: this.documentos
        };
        this.loading = false;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.mostrarError('Error al cargar documentos', 'No se pudieron cargar los tipos de documentos.');
        this.loading = false;
        this.isLoading = false;
      }
    });
  }

  refreshData(): void {
    this.cargarDocumentos();
  }

  // CRUD Operations
  abrirModalCrear(): void {
    this.editandoDocumento = false;
    this.documentoForm.reset();
    this.editingDocumentoId = null;
    this.originalDocumento = null;
    this.mostrarModalCrear = true;
  }

  editarDocumento(documento: DocumentoTabla): void {
    this.editandoDocumento = true;
    this.documentoForm.patchValue({
      tipo: documento.tipo,
      descripcion: documento.descripcion
    });
    // Guardar referencia al documento original y su id para usar en la actualización
    this.editingDocumentoId = documento.id;
    this.originalDocumento = { ...documento };
    this.mostrarModalCrear = true;
  }

  guardarDocumento(): void {
    if (this.documentoForm.valid) {
      this.loading = true;
      // Construir payload asegurando que siempre enviamos tipo y descripcion.
      // Si el usuario no modificó alguno de los campos, usamos el valor original como fallback.
      const formTipo = this.documentoForm.get('tipo')?.value;
      const formDescripcion = this.documentoForm.get('descripcion')?.value;

      const tipo = formTipo ?? this.originalDocumento?.tipo ?? '';
      const descripcion = formDescripcion ?? this.originalDocumento?.descripcion ?? '';

      const documentoData: DocumentoRequest = {
        tipo,
        descripcion,
        estado: this.originalDocumento?.estado ?? true
      };

      let operation: any;
      if (this.editandoDocumento) {
        const idToUpdate = this.editingDocumentoId ?? this.originalDocumento?.id;
        if (idToUpdate == null) {
          // Estado inconsistente: no tenemos id para actualizar
          this.mostrarError('Error', 'No se pudo identificar el documento a actualizar.');
          this.loading = false;
          return;
        }
        operation = this.documentoService.updateDocumento(idToUpdate, documentoData);
      } else {
        operation = this.documentoService.createDocumento(documentoData);
      }

      operation.subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarDocumentos();
          this.loading = false;
        },
        error: (error: unknown) => {
          console.error('Error al guardar documento:', error);
          this.mostrarError(
            this.editandoDocumento ? 'Error al actualizar' : 'Error al crear',
            'No se pudo guardar el tipo de documento.'
          );
          this.loading = false;
        }
      });
    }
  }

  eliminarDocumento(id: number): void {
    const documento = this.documentos.find(d => d.id === id);
    if (documento) {
      this.documentoAEliminar = documento;
      this.mostrarModalEliminar = true;
    }
  }

  confirmarEliminacionModal(): void {
    if (this.documentoAEliminar) {
      this.loading = true;
      this.documentoService.deleteDocumento(this.documentoAEliminar.id).subscribe({
        next: () => {
          this.cerrarModalEliminar();
          this.cargarDocumentos();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al eliminar documento:', error);
          this.mostrarError('Error al eliminar', 'No se pudo eliminar el tipo de documento.');
          this.loading = false;
        }
      });
    }
  }

  // Modal controls
  cerrarModal(): void {
    this.mostrarModalCrear = false;
    this.documentoForm.reset();
    this.editandoDocumento = false;
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.documentoAEliminar = null;
  }

  cerrarModalConfirmacion(): void {
    this.mostrarModalConfirmacion = false;
    this.documentoAConfirmar = null;
  }

  confirmarCambioEstado(): void {
    if (this.documentoAConfirmar) {
      const nuevoEstado = this.accionConfirmacion === 'activar';
      this.cambiarEstadoDocumento(this.documentoAConfirmar.id, nuevoEstado);
      this.cerrarModalConfirmacion();
    }
  }

  cerrarModalError(): void {
    this.mostrarModalError = false;
    this.backendErrorData = null;
  }

  // Utility methods
  formatDate(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  private formatDateToString(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  getTipoLabel(tipo: string): string {
    const option = this.tipoOptions.find(opt => opt.value === tipo);
    return option ? option.label : tipo;
  }

  // Métodos para reutilizar componentes compartidos
  convertToModuleCardForConfirmation(documento: DocumentoTabla): ModuleCardData {
    const nuevoEstado = !documento.estado;
    return {
      title: this.getTipoLabel(documento.tipo),
      description: documento.descripcion || 'Sin descripción',
      route: '#',
      icon: 'fas fa-file-alt',
      iconType: 'documentos',
      status: {
        text: nuevoEstado ? 'Se activará' : 'Se desactivará',
        type: nuevoEstado ? 'success' : 'warning'
      },
      action: {
        text: nuevoEstado ? 'Activar' : 'Desactivar'
      }
    };
  }

  onCardAction(documento: DocumentoTabla): void {
    // Mostrar modal de confirmación con la card del documento
    this.documentoAConfirmar = documento;
    this.accionConfirmacion = documento.estado ? 'desactivar' : 'activar';
    this.mostrarModalConfirmacion = true;
  }

  private cambiarEstadoDocumento(id: number, nuevoEstado: boolean): void {
    // Actualizar estado inmediatamente en la UI para mejor UX
    const documento = this.documentos.find(d => d.id === id);
    if (documento) {
      documento.estado = nuevoEstado;
      documento.actualizado = this.formatDateToString(new Date());
    }

    // Actualizar el tableConfig con los nuevos datos
    this.tableConfig = {
      ...this.tableConfig,
      data: [...this.documentos]
    };
    this.cdr.detectChanges();

    // Simular llamada al servicio (aquí iría la llamada real al backend)
    // this.documentoService.updateDocumentoEstado(id, nuevoEstado).subscribe({
    //   next: () => {
    //     // Estado ya actualizado en la UI
    //   },
    //   error: (error) => {
    //     // Revertir el cambio si hay error
    //     if (documento) {
    //       documento.estado = !nuevoEstado;
    //       this.tableConfig = { ...this.tableConfig, data: [...this.documentos] };
    //       this.cdr.detectChanges();
    //     }
    //     this.mostrarError('Error al cambiar estado', 'No se pudo actualizar el estado del documento.');
    //   }
    // });
  }

  // Error handling
  private mostrarError(title: string, message: string, backendError?: any): void {
    this.errorModalData = { title, message };
    this.mostrarModalError = true;
  }
}
