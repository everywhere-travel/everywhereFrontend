import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Services
import { DocumentoCobranzaService } from '../../core/service/DocumentoCobranza/DocumentoCobranza.service';
import { PdfService } from '../../core/service/Pdf/Pdf.service';
import { CotizacionService } from '../../core/service/Cotizacion/cotizacion.service';
import { NaturalJuridicoService } from '../../core/service/NaturalJuridico/natural-juridico.service';
import { SucursalService } from '../../core/service/Sucursal/sucursal.service';
import { PersonaService } from '../../core/service/persona/persona.service';
import {
  MenuConfigService,
  ExtendedSidebarMenuItem,
} from '../../core/service/menu/menu-config.service';

// Models
import { DocumentoCobranzaResponseDTO } from '../../shared/models/DocumetnoCobranza/documentoCobranza.model';
import { CotizacionResponse } from '../../shared/models/Cotizacion/cotizacion.model';
import { NaturalJuridicaResponse } from '../../shared/models/NaturalJuridica/naturalJuridica.models';
import { SucursalResponse } from '../../shared/models/Sucursal/sucursal.model';

// Components
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { DataTableConfig } from '../../shared/components/data-table/data-table.config';

// Interface para la tabla de documentos de cobranza
interface DocumentoCobranzaTabla {
  id: number;
  numero: string;
  codigoCotizacion: string;
  clienteNombre: string;
  fechaEmision: string;
  moneda: string;
  fileVenta: string;
  createdAt: string;
  updatedAt: string;
  documentoOriginal: DocumentoCobranzaResponseDTO;
}

@Component({
  selector: 'app-documento-cobranza',
  standalone: true,
  templateUrl: './documento-cobranza.component.html',
  styleUrls: ['./documento-cobranza.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SidebarComponent, DataTableComponent],
})
export class DocumentoCobranzaComponent implements OnInit, OnDestroy {
  // ===== SERVICES INJECTION =====
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private documentoCobranzaService = inject(DocumentoCobranzaService);
  private pdfService = inject(PdfService);
  private cotizacionService = inject(CotizacionService);
  private naturalJuridicoService = inject(NaturalJuridicoService);
  private sucursalService = inject(SucursalService);
  private personaService = inject(PersonaService);

  // ===== UI STATE =====
  loading: boolean = false;
  isLoading = false;
  sidebarCollapsed = false;
  mostrarModalCrear = false;
  mostrarModalVer = false;
  mostrarModalCotizaciones = false;
  mostrarFormulario = false;
  editandoDocumento = false;

  // ===== DATA ARRAYS =====
  documentos: DocumentoCobranzaResponseDTO[] = [];
  filteredDocumentos: DocumentoCobranzaResponseDTO[] = [];
  cotizaciones: CotizacionResponse[] = [];
  cotizacionesFiltradas: CotizacionResponse[] = [];
  personasJuridicas: NaturalJuridicaResponse[] = [];
  sucursales: SucursalResponse[] = [];

  // ===== SELECTION STATE =====
  documentoSeleccionado: DocumentoCobranzaResponseDTO | null = null;
  cotizacionSeleccionada: CotizacionResponse | null = null;
  personaJuridicaSeleccionada: NaturalJuridicaResponse | null = null;
  sucursalSeleccionada: SucursalResponse | null = null;
  personaNaturalIdActual: number | null = null;

  // ===== SEARCH AND FILTERS =====
  searchTerm = '';
  searchCotizacion = '';

  totalItems = 0;

  // ===== MESSAGES =====
  errorMessage: string = '';
  successMessage: string = '';
  showErrorMessage: boolean = false;
  showSuccessMessage: boolean = false;

  // ===== FORMS =====
  searchForm!: FormGroup;
  documentoForm!: FormGroup;

  // ===== SIDEBAR CONFIGURATION =====
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

  // ===== DATA TABLE CONFIGURATION =====
  documentosTabla: DocumentoCobranzaTabla[] = [];
  tableConfig: DataTableConfig<DocumentoCobranzaTabla> = {
    data: [],
    columns: [
      {
        key: 'numero',
        header: 'Número',
        icon: 'fa-hashtag',
        sortable: true,
        width: '150px',
      },
      {
        key: 'codigoCotizacion',
        header: 'Cotización',
        icon: 'fa-file-alt',
        sortable: true,
      },
      {
        key: 'clienteNombre',
        header: 'Cliente',
        icon: 'fa-user',
        sortable: true,
      },
      {
        key: 'fechaEmision',
        header: 'Fecha Emisión',
        icon: 'fa-calendar',
        sortable: true,
      },
      {
        key: 'moneda',
        header: 'Moneda',
        icon: 'fa-money-bill',
        sortable: true,
        align: 'center',
        width: '100px',
      },
    ],
    enableSearch: true,
    searchPlaceholder: 'Buscar por número, cotización, cliente...',
    enableSelection: true,
    enablePagination: true,
    enableViewSwitcher: true,
    enableSorting: true,
    itemsPerPage: 10,
    pageSizeOptions: [5, 10, 25, 50],
    actions: [
      {
        icon: 'fa-eye',
        label: 'Ver',
        color: 'green',
        handler: (item) => this.verDetalleDocumento(item.documentoOriginal),
      },
      {
        icon: 'fa-edit',
        label: 'Editar',
        color: 'blue',
        handler: (item) => this.editarDocumento(item.documentoOriginal),
      },
      {
        icon: 'fa-file-pdf',
        label: 'Ver PDF',
        color: 'gray',
        handler: (item) => this.verPDF(item.documentoOriginal),
      },
      {
        icon: 'fa-download',
        label: 'Descargar PDF',
        color: 'purple',
        handler: (item) => this.descargarPDF(item.documentoOriginal),
      },
    ],
    bulkActions: [
      {
        icon: 'fa-trash',
        label: 'Eliminar seleccionados',
        color: 'red',
        handler: (items) => this.eliminarDocumentosMasivo(items.map((i) => i.id)),
        confirm: {
          title: 'Eliminar documentos',
          message: 'Esta acción no se puede deshacer',
        },
      },
    ],
    emptyMessage: 'No se encontraron documentos de cobranza',
    loadingMessage: 'Cargando documentos...',
    defaultView: 'table',
    enableRowHover: true,
    trackByKey: 'id',
  };

  constructor(private menuConfigService: MenuConfigService) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadInitialData();
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/documentos-cobranza');
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions if needed
  }

  // ===== STATS METHODS =====
  getTotalDocumentos(): number {
    return this.documentos.length;
  }

  getDocumentosConPdf(): number {
    return this.documentos.filter((doc) => doc.id).length; // Todos los documentos con ID tienen PDF disponible
  }

  getCotizacionesDisponibles(): number {
    return this.cotizaciones.length;
  }

  // ===== INITIALIZATION =====
  private initializeForms(): void {
    this.searchForm = this.fb.group({
      searchTerm: [''],
    });

    this.documentoForm = this.fb.group({
      nroSerie: [''],
      fileVenta: [''],
      costoEnvio: [0],
      fechaEmision: [''],
      clienteEmail: [''],
      clienteTelefono: [''],
      clienteNombre: [''],
      clienteDocumento: [''],
      sucursalDescripcion: [''],
      puntoCompra: [''],
      moneda: [''],
      formaPago: [''],
      observaciones: [''],
    });

    // Setup search
    this.searchForm.get('searchTerm')?.valueChanges.subscribe((value) => {
      this.searchTerm = value;
      this.filterDocumentos();
    });
  }

  private async loadInitialData(): Promise<void> {
    this.loading = true;
    this.isLoading = true;
    try {
      await this.loadDocumentos();
      await this.loadCotizaciones();
    } catch (error) {
      this.showError('Error al cargar los datos iniciales');
    } finally {
      this.loading = false;
      this.isLoading = false;
    }
  }

  // ===== DATA LOADING =====
  private async loadDocumentos(setLoading: boolean = false): Promise<void> {
    try {
      if (setLoading) {
        this.loading = true;
        this.isLoading = true;
      }

      this.documentos = (await this.documentoCobranzaService.getAllDocumentos().toPromise()) || [];

      this.filteredDocumentos = [...this.documentos];
      this.totalItems = this.documentos.length;
      this.updateTableConfig();
    } catch (error) {
      console.error('Error al cargar documentos:', error);
      this.showError('Error al cargar los documentos de cobranza');
      this.documentos = [];
    } finally {
      if (setLoading) {
        this.loading = false;
        this.isLoading = false;
      }
    }
  }

  private async loadCotizaciones(): Promise<void> {
    try {
      const todasLasCotizaciones =
        (await this.cotizacionService.getAllCotizaciones().toPromise()) || [];

      // Filtrar solo las cotizaciones que no tienen documento de cobranza creado
      this.cotizaciones = todasLasCotizaciones.filter((cotizacion) => {
        // Verificar si ya existe un documento de cobranza para esta cotización
        const yaExisteDocumento = this.documentos.some(
          (documento) =>
            documento.cotizacionId === cotizacion.id ||
            documento.codigoCotizacion === cotizacion.codigoCotizacion,
        );
        return !yaExisteDocumento;
      });

      this.cotizacionesFiltradas = [...this.cotizaciones];
    } catch (error) {
      console.error('Error al cargar cotizaciones:', error);
      this.cotizaciones = [];
    }
  }

  // ===== REFRESH METHODS =====
  async actualizarDatos(): Promise<void> {
    this.loading = true;
    this.isLoading = true;
    try {
      await this.loadDocumentos();
      await this.loadCotizaciones();
    } catch (error) {
      this.showError('Error al actualizar los datos');
    } finally {
      this.loading = false;
      this.isLoading = false;
    }
  }

  async recargarDocumentos(): Promise<void> {
    await this.loadDocumentos();
  }

  // ===== MESSAGE HANDLING =====
  private showError(message: string): void {
    this.errorMessage = message;
    this.showErrorMessage = true;
    setTimeout(() => this.hideMessages(), 5000);
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.showSuccessMessage = true;
    setTimeout(() => this.hideMessages(), 3000);
  }

  hideMessages(): void {
    this.showErrorMessage = false;
    this.showSuccessMessage = false;
  }

  // ===== SEARCH AND FILTER =====
  clearSearch(): void {
    this.searchForm.patchValue({ searchTerm: '' });
    this.searchTerm = '';
    this.filterDocumentos();
  }

  private filterDocumentos(): void {
    if (!this.searchTerm.trim()) {
      this.filteredDocumentos = [...this.documentos];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredDocumentos = this.documentos.filter(
        (doc) =>
          doc.serie?.toLowerCase().includes(term) ||
          doc.correlativo?.toString().includes(term) ||
          doc.fileVenta?.toLowerCase().includes(term) ||
          doc.clienteNombre?.toLowerCase().includes(term) ||
          doc.codigoCotizacion?.toLowerCase().includes(term),
      );
    }
    this.totalItems = this.filteredDocumentos.length;
    this.updateTableConfig();
  }

  // ===== TABLE CONFIG UPDATE =====
  private updateTableConfig(): void {
    this.documentosTabla = this.filteredDocumentos.map((doc) => ({
      id: doc.id || 0,
      numero: this.getNumeroDocumento(doc),
      codigoCotizacion: doc.codigoCotizacion || 'Sin cotización',
      clienteNombre: doc.clienteNombre || 'Sin nombre',
      fechaEmision: this.formatDate(doc.fechaEmision),
      moneda: doc.moneda || 'PEN',
      fileVenta: doc.fileVenta || 'Sin file',
      createdAt: this.formatDateTime(doc.createdAt),
      updatedAt: this.formatDateTime(doc.updatedAt),
      documentoOriginal: doc,
    }));

    this.tableConfig = {
      ...this.tableConfig,
      data: this.documentosTabla,
    };
  }

  // ===== BULK DELETE =====
  // TODO: Implementar cuando el servicio tenga el método deleteDocumento
  eliminarDocumentosMasivo(ids: number[]): void {
    this.showError('La eliminación masiva aún no está disponible.');
  }

  confirmarEliminacion(documento: DocumentoCobranzaTabla): void {
    this.showError('La eliminación aún no está disponible.');
  }

  // ===== NAVIGATION METHODS =====
  verDetalleDocumento(documento: DocumentoCobranzaResponseDTO): void {
    if (documento.id) {
      this.router.navigate(['/documentos-cobranza/detalle', documento.id]);
    }
  }

  editarDocumento(documento: DocumentoCobranzaResponseDTO): void {
    if (documento?.id) {
      this.router.navigate(['/documentos-cobranza/detalle', documento.id]);
    }
  }

  // ===== MODAL METHODS =====
  mostrarModalVerDocumento(documento: DocumentoCobranzaResponseDTO): void {
    this.documentoSeleccionado = documento;
    this.mostrarModalVer = true;
  }

  cerrarModalVer(): void {
    this.mostrarModalVer = false;
    this.documentoSeleccionado = null;
  }

  async mostrarFormularioCrear(): Promise<void> {
    this.editandoDocumento = false;
    this.resetForm();

    // Asegurarse de que los documentos estén cargados antes de filtrar las cotizaciones
    if (this.documentos.length === 0) {
      await this.loadDocumentos();
    }

    await this.loadCotizaciones();
    this.mostrarModalCotizaciones = true;
  }

  async mostrarFormularioEditar(documento: DocumentoCobranzaResponseDTO): Promise<void> {
    this.editandoDocumento = true;
    this.documentoSeleccionado = documento;
    this.populateForm(documento);
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.mostrarModalCotizaciones = false;
    this.editandoDocumento = false;
    this.documentoSeleccionado = null;
    this.cotizacionSeleccionada = null;
    this.personaJuridicaSeleccionada = null;
    this.sucursalSeleccionada = null;
    this.personaNaturalIdActual = null;
    this.personasJuridicas = [];
    this.sucursales = [];
    this.resetForm();
  }

  private resetForm(): void {
    this.documentoForm.reset({
      nroSerie: '',
      fileVenta: '',
      costoEnvio: 0,
      fechaEmision: '',
      clienteEmail: '',
      clienteTelefono: '',
      clienteNombre: '',
      clienteDocumento: '',
      sucursalDescripcion: '',
      puntoCompra: '',
      moneda: '',
      formaPago: '',
      observaciones: '',
    });
  }

  private populateForm(documento: DocumentoCobranzaResponseDTO): void {
    this.documentoForm.patchValue({
      nroSerie: documento.serie,
      correlativo: documento.correlativo,
      fileVenta: documento.fileVenta,
      costoEnvio: documento.costoEnvio,
      fechaEmision: documento.fechaEmision ? documento.fechaEmision.split('T')[0] : '',
      clienteEmail: '', // No disponible en ResponseDTO
      clienteTelefono: '', // No disponible en ResponseDTO
      clienteNombre: documento.clienteNombre,
      clienteDocumento: '', // No disponible en ResponseDTO
      sucursalDescripcion: documento.sucursalDescripcion,
      puntoCompra: '', // No disponible en ResponseDTO
      moneda: documento.moneda,
      formaPago: documento.formaPagoDescripcion,
      observaciones: documento.observaciones,
    });
  }

  // ===== COTIZACIONES METHODS =====
  filtrarCotizaciones(): void {
    if (!this.searchCotizacion.trim()) {
      this.cotizacionesFiltradas = [...this.cotizaciones];
    } else {
      const term = this.searchCotizacion.toLowerCase();
      this.cotizacionesFiltradas = this.cotizaciones.filter(
        (cot) =>
          cot.codigoCotizacion?.toLowerCase().includes(term) ||
          cot.origenDestino?.toLowerCase().includes(term),
      );
    }
  }

  async seleccionarCotizacion(cotizacion: CotizacionResponse): Promise<void> {
    this.cotizacionSeleccionada = cotizacion;
    this.mostrarModalCotizaciones = false;
    // Cargar personas jurídicas y sucursales para la selección
    await this.cargarOpcionesCreacion(cotizacion);
  }

  cancelarSeleccionCotizacion(): void {
    this.mostrarModalCotizaciones = false;
    this.cotizacionSeleccionada = null;
  }

  filterCotizaciones(): void {
    const searchTerm = this.searchCotizacion.toLowerCase().trim();

    if (!searchTerm) {
      this.cotizacionesFiltradas = [...this.cotizaciones];
      return;
    }

    this.cotizacionesFiltradas = this.cotizaciones.filter((cotizacion) => {
      const codigoCotizacion = cotizacion.codigoCotizacion?.toLowerCase() || '';
      const personaDisplay = this.getPersonaDisplayName(cotizacion).toLowerCase();
      const origenDestino = cotizacion.origenDestino?.toLowerCase() || '';

      return (
        codigoCotizacion.includes(searchTerm) ||
        personaDisplay.includes(searchTerm) ||
        origenDestino.includes(searchTerm)
      );
    });
  }

  // ===== PDF METHODS =====
  descargarPDF(documento: DocumentoCobranzaResponseDTO): void {
    if (!documento.serie) {
      this.showError('No se puede generar PDF: documento sin número de serie');
      return;
    }

    if (!documento.correlativo) {
      this.showError('No se puede generar PDF: documento sin correlativo');
      return;
    }

    const documentoId = documento.id;
    if (!documentoId) {
      this.showError('No se puede generar PDF: documento sin ID');
      return;
    }

    this.pdfService.downloadDocumentoCobranzaPdf(
      documentoId,
      documento.serie,
      documento.correlativo,
    );
  }

  verPDF(documento: DocumentoCobranzaResponseDTO): void {
    const documentoId = documento.id;
    if (!documentoId) {
      this.showError('No se puede visualizar PDF: documento sin ID');
      return;
    }

    this.pdfService.viewDocumentoCobranzaPdf(documentoId);
  }

  // ===== SIDEBAR METHODS =====
  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: ExtendedSidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  // ===== UTILITY METHODS =====
  getPersonaDisplayName(cotizacion: CotizacionResponse): string {
    // Intentar obtener el primer email de la persona
    if (cotizacion.personas?.correos && cotizacion.personas.correos.length > 0) {
      return cotizacion.personas.correos[0].email;
    }

    // Si no hay email, intentar mostrar dirección o ID
    if (cotizacion.personas?.direccion) {
      return cotizacion.personas.direccion;
    }

    if (cotizacion.personas?.id) {
      return `Cliente ID: ${cotizacion.personas.id}`;
    }

    return 'Cliente no especificado';
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';

    // Si la fecha viene en formato LocalDate (YYYY-MM-DD) del backend,
    // parseamos manualmente para evitar problemas de zona horaria
    const dateParts = dateString.split('T')[0].split('-');
    if (dateParts.length === 3) {
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10);
      const day = parseInt(dateParts[2], 10);

      // Crear fecha en la zona horaria local sin conversión UTC
      const localDate = new Date(year, month - 1, day);
      return localDate.toLocaleDateString('es-ES');
    }

    // Fallback al método original si el formato es inesperado
    return new Date(dateString).toLocaleDateString('es-ES');
  }

  formatDateTime(dateString: string | undefined): string {
    if (!dateString) return 'N/A';

    // Parsear LocalDateTime del backend (YYYY-MM-DDTHH:mm:ss)
    const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    if (isoMatch) {
      const [, year, month, day, hour, minute, second] = isoMatch;
      // Crear fecha en zona horaria local sin conversión UTC
      const localDate = new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
        parseInt(hour, 10),
        parseInt(minute, 10),
        parseInt(second, 10),
      );
      return localDate.toLocaleString('es-ES');
    }

    // Fallback al método original si el formato es inesperado
    return new Date(dateString).toLocaleString('es-ES');
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return 'S/ 0.00';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  }

  getNumeroDocumento(documento: DocumentoCobranzaResponseDTO): string {
    if (
      documento?.serie &&
      documento?.correlativo !== undefined &&
      documento?.correlativo !== null
    ) {
      return `${documento.serie}-${String(documento.correlativo).padStart(9, '0')}`;
    }
    return 'Sin número';
  }

  trackByDocumento(index: number, documento: DocumentoCobranzaResponseDTO): any {
    return documento.id ?? index;
  }

  // ===== NUEVOS MÉTODOS PARA SELECCIÓN =====
  async cargarOpcionesCreacion(cotizacion: CotizacionResponse): Promise<void> {
    try {
      this.isLoading = true;

      // Cargar sucursales
      this.sucursales = (await this.sucursalService.findAllSucursal().toPromise()) || [];

      // Obtener personaId de la cotización (ID de tabla 'personas')
      // El backend tiene PersonaNaturalRepository.findByPersonasId() que convierte automáticamente
      if (cotizacion.personas?.id) {
        try {
          const personaId = cotizacion.personas.id;
          this.personaNaturalIdActual = personaId;

          // Cargar personas jurídicas asociadas
          // El backend convierte internamente de personas.id a persona_natural.id
          this.personasJuridicas =
            (await this.naturalJuridicoService.findByPersonaNaturalId(personaId).toPromise()) || [];
        } catch (error) {
          this.personasJuridicas = [];
          this.personaNaturalIdActual = null;
        }
      }

      // Mostrar modal de creación
      this.mostrarFormulario = true;
    } catch (error) {
      this.showError('Error al cargar las opciones de creación');
    } finally {
      this.isLoading = false;
    }
  }

  async confirmarCreacionDocumento(): Promise<void> {
    if (!this.cotizacionSeleccionada) {
      this.showError('No se ha seleccionado una cotización');
      return;
    }

    try {
      this.isLoading = true;

      const personaJuridicaId = this.personaJuridicaSeleccionada?.personaJuridica?.id;
      const sucursalId = this.sucursalSeleccionada?.id;

      this.documentoCobranzaService
        .createDocumentoCobranza(this.cotizacionSeleccionada.id, personaJuridicaId, sucursalId)
        .subscribe({
          next: async (documento) => {
            this.showSuccess('Documento de cobranza creado exitosamente');
            await this.recargarDocumentos();
            this.cerrarFormulario();
          },
          error: (error) => {
            const errorMsg =
              error.error?.message || error.message || 'Error al crear el documento de cobranza';
            this.showError(errorMsg);
          },
          complete: () => {
            this.isLoading = false;
          },
        });
    } catch (error) {
      this.isLoading = false;
      this.showError('Error inesperado al crear el documento');
    }
  }

  seleccionarPersonaJuridica(personaJuridica: NaturalJuridicaResponse | null): void {
    this.personaJuridicaSeleccionada = personaJuridica;
  }

  seleccionarSucursal(sucursal: SucursalResponse | null): void {
    this.sucursalSeleccionada = sucursal;
  }

  usarDatosPersonales(): void {
    this.personaJuridicaSeleccionada = null;
  }
}
