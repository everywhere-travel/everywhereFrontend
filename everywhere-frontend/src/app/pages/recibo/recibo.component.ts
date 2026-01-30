import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Services
import { ReciboService } from '../../core/service/Recibo/recibo.service';
import { PdfService } from '../../core/service/Pdf/Pdf.service';
import { CotizacionService } from '../../core/service/Cotizacion/cotizacion.service';
import { NaturalJuridicoService } from '../../core/service/NaturalJuridico/natural-juridico.service';
import { SucursalService } from '../../core/service/Sucursal/sucursal.service';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';

// Models
import { ReciboResponseDTO } from '../../shared/models/Recibo/recibo.model';
import { CotizacionResponse } from '../../shared/models/Cotizacion/cotizacion.model';
import { NaturalJuridicaResponse } from '../../shared/models/NaturalJuridica/naturalJuridica.models';
import { SucursalResponse } from '../../shared/models/Sucursal/sucursal.model';

// Components
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';


@Component({
  selector: 'app-recibo',
  standalone: true,
  templateUrl: './recibo.component.html',
  styleUrls: ['./recibo.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SidebarComponent]
})
export class ReciboComponent implements OnInit, OnDestroy {

  // ===== SERVICES INJECTION =====
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private reciboService = inject(ReciboService);
  private pdfService = inject(PdfService);
  private cotizacionService = inject(CotizacionService);
  private naturalJuridicoService = inject(NaturalJuridicoService);
  private sucursalService = inject(SucursalService);

  // ===== UI STATE =====
  loading: boolean = false;
  isLoading = false;
  sidebarCollapsed = false;
  currentView: 'table' | 'cards' | 'list' = 'table';
  mostrarModalCrear = false;
  mostrarModalVer = false;
  mostrarModalCotizaciones = false;
  mostrarFormulario = false;
  editandoDocumento = false;

  // ===== DATA ARRAYS =====
  recibos: ReciboResponseDTO[] = [];
  filteredRecibos: ReciboResponseDTO[] = [];
  cotizaciones: CotizacionResponse[] = [];
  cotizacionesFiltradas: CotizacionResponse[] = [];
  personasJuridicas: NaturalJuridicaResponse[] = [];
  sucursales: SucursalResponse[] = [];

  // ===== SELECTION STATE =====
  reciboSeleccionado: ReciboResponseDTO | null = null;
  cotizacionSeleccionada: CotizacionResponse | null = null;
  personaJuridicaSeleccionada: NaturalJuridicaResponse | null = null;
  sucursalSeleccionada: SucursalResponse | null = null;
  personaNaturalIdActual: number | null = null;
  selectedItems: number[] = [];
  allSelected: boolean = false;
  someSelected: boolean = false;

  // ===== SEARCH AND FILTERS =====
  searchTerm = '';
  searchCotizacion = '';

  // ===== PAGINATION =====
  currentPage = 1;
  itemsPerPage = 10;
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

  // ===== TEMPLATE UTILITIES =====
  Math = Math;

  constructor(private menuConfigService: MenuConfigService) { }

  ngOnInit(): void {
    this.initializeForms();
    this.loadInitialData();
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/recibos');
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions if needed
  }

  // ===== STATS METHODS =====
  getTotalRecibos(): number {
    return this.recibos.length;
  }

  getRecibosConPdf(): number {
    return this.recibos.filter(recibo => recibo.id).length; // Todos los recibos con ID tienen PDF disponible
  }

  getCotizacionesDisponibles(): number {
    return this.cotizaciones.length;
  }

  // ===== INITIALIZATION =====
  private initializeForms(): void {
    this.searchForm = this.fb.group({
      searchTerm: ['']
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
      observaciones: ['']
    });

    // Setup search
    this.searchForm.get('searchTerm')?.valueChanges.subscribe(value => {
      this.searchTerm = value;
      this.filterRecibos();
    });
  }

  private async loadInitialData(): Promise<void> {
    this.loading = true;
    this.isLoading = true;
    try {
      await this.loadRecibos();
      await this.loadCotizaciones();
    } catch (error) {
      this.showError('Error al cargar los datos iniciales');
    } finally {
      this.loading = false;
      this.isLoading = false;
    }
  }

  // ===== DATA LOADING =====
  private async loadRecibos(setLoading: boolean = false): Promise<void> {
    try {
      if (setLoading) {
        this.loading = true;
        this.isLoading = true;
      }

      this.recibos = await this.reciboService.getAllRecibos().toPromise() || [];

      this.filteredRecibos = [...this.recibos];
      this.totalItems = this.recibos.length;
    } catch (error) {
      console.error('Error al cargar recibos:', error);
      this.showError('Error al cargar los recibos');
      this.recibos = [];
    } finally {
      if (setLoading) {
        this.loading = false;
        this.isLoading = false;
      }
    }
  }

  private async loadCotizaciones(): Promise<void> {
    try {
      const todasLasCotizaciones = await this.cotizacionService.getAllCotizaciones().toPromise() || [];

      // Filtrar solo las cotizaciones que no tienen recibo creado
      this.cotizaciones = todasLasCotizaciones.filter(cotizacion => {
        // Verificar si ya existe un recibo para esta cotización
        const yaExisteRecibo = this.recibos.some(recibo =>
          recibo.cotizacionId === cotizacion.id ||
          recibo.codigoCotizacion === cotizacion.codigoCotizacion
        );
        return !yaExisteRecibo;
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
      await this.loadRecibos();
      await this.loadCotizaciones();
    } catch (error) {
      this.showError('Error al actualizar los datos');
    } finally {
      this.loading = false;
      this.isLoading = false;
    }
  }

  async recargarRecibos(): Promise<void> {
    await this.loadRecibos();
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
    this.filterRecibos();
  }

  private filterRecibos(): void {
    if (!this.searchTerm.trim()) {
      this.filteredRecibos = [...this.recibos];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredRecibos = this.recibos.filter(recibo =>
        recibo.serie?.toLowerCase().includes(term) ||
        recibo.correlativo?.toString().includes(term) ||
        recibo.fileVenta?.toLowerCase().includes(term) ||
        recibo.clienteNombre?.toLowerCase().includes(term) ||
        recibo.codigoCotizacion?.toLowerCase().includes(term)
      );
    }
    this.totalItems = this.filteredRecibos.length;
    this.currentPage = 1;
  }

  // ===== VIEW METHODS =====
  changeView(view: 'table' | 'cards' | 'list'): void {
    this.currentView = view;
  }

  // ===== NAVIGATION METHODS =====
  verDetalleDocumento(recibo: ReciboResponseDTO): void {
    if (recibo.id) {
      this.router.navigate(['/recibos/detalle', recibo.id]);
    }
  }

  editarDocumento(recibo: ReciboResponseDTO): void {
    if (recibo?.id) {
      this.router.navigate(['/recibos/detalle', recibo.id]);
    }
  }

  // ===== MODAL METHODS =====
  mostrarModalVerDocumento(recibo: ReciboResponseDTO): void {
    this.reciboSeleccionado = recibo;
    this.mostrarModalVer = true;
  }

  cerrarModalVer(): void {
    this.mostrarModalVer = false;
    this.reciboSeleccionado = null;
  }

  async mostrarFormularioCrear(): Promise<void> {
    this.editandoDocumento = false;
    this.resetForm();

    // Asegurarse de que los recibos estén cargados antes de filtrar las cotizaciones
    if (this.recibos.length === 0) {
      await this.loadRecibos();
    }

    await this.loadCotizaciones();
    this.mostrarModalCotizaciones = true;
  }

  async mostrarFormularioEditar(documento: ReciboResponseDTO): Promise<void> {
    this.editandoDocumento = true;
    this.reciboSeleccionado = documento;
    this.populateForm(documento);
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.mostrarModalCotizaciones = false;
    this.editandoDocumento = false;
    this.reciboSeleccionado = null;
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
      observaciones: ''
    });
  }

  private populateForm(documento: ReciboResponseDTO): void {
    this.documentoForm.patchValue({
      nroSerie: documento.serie,
      correlativo: documento.correlativo,
      fileVenta: documento.fileVenta,
      fechaEmision: documento.fechaEmision ? documento.fechaEmision.split('T')[0] : '',
      clienteEmail: '', // No disponible en ResponseDTO
      clienteTelefono: '', // No disponible en ResponseDTO
      clienteNombre: documento.clienteNombre,
      clienteDocumento: '', // No disponible en ResponseDTO
      sucursalDescripcion: documento.sucursalDescripcion,
      puntoCompra: '', // No disponible en ResponseDTO
      moneda: documento.moneda,
      formaPago: documento.formaPagoDescripcion,
      observaciones: documento.observaciones
    });
  }

  // ===== COTIZACIONES METHODS =====
  filtrarCotizaciones(): void {
    if (!this.searchCotizacion.trim()) {
      this.cotizacionesFiltradas = [...this.cotizaciones];
    } else {
      const term = this.searchCotizacion.toLowerCase();
      this.cotizacionesFiltradas = this.cotizaciones.filter(cot =>
        cot.codigoCotizacion?.toLowerCase().includes(term) ||
        cot.origenDestino?.toLowerCase().includes(term)
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

    this.cotizacionesFiltradas = this.cotizaciones.filter(cotizacion => {
      const codigoCotizacion = cotizacion.codigoCotizacion?.toLowerCase() || '';
      const personaDisplay = this.getPersonaDisplayName(cotizacion).toLowerCase();
      const origenDestino = cotizacion.origenDestino?.toLowerCase() || '';

      return codigoCotizacion.includes(searchTerm) ||
        personaDisplay.includes(searchTerm) ||
        origenDestino.includes(searchTerm);
    });
  }

  // ===== PDF METHODS =====
  descargarPDF(recibo: ReciboResponseDTO): void {
    if (!recibo.serie) {
      this.showError('No se puede generar PDF: recibo sin número de serie');
      return;
    }

    if (!recibo.correlativo) {
      this.showError('No se puede generar PDF: recibo sin correlativo');
      return;
    }

    const reciboId = recibo.id;
    if (!reciboId) {
      this.showError('No se puede generar PDF: recibo sin ID');
      return;
    }

    this.pdfService.downloadReciboPdf(reciboId, recibo.serie, recibo.correlativo);
  }

  verPDF(recibo: ReciboResponseDTO): void {
    const reciboId = recibo.id;
    if (!reciboId) {
      this.showError('No se puede visualizar PDF: recibo sin ID');
      return;
    }

    this.pdfService.viewReciboPdf(reciboId);
  }

  // ===== SELECTION METHODS =====
  toggleAllSelection(): void {
    if (this.allSelected) {
      this.selectedItems = [];
    } else {
      this.selectedItems = this.filteredRecibos
        .map(recibo => (recibo as any).id)
        .filter(id => id !== undefined && id !== null);
    }
    this.updateSelectionState();
  }

  toggleSelection(id: number | undefined): void {
    if (!id) return;
    const index = this.selectedItems.indexOf(id);
    if (index > -1) {
      this.selectedItems.splice(index, 1);
    } else {
      this.selectedItems.push(id);
    }
    this.updateSelectionState();
  }

  isSelected(id: number | undefined): boolean {
    if (!id) return false;
    return this.selectedItems.includes(id);
  }

  updateSelectionState(): void {
    this.allSelected = this.selectedItems.length === this.filteredRecibos.length && this.filteredRecibos.length > 0;
    this.someSelected = this.selectedItems.length > 0 && !this.allSelected;
  }

  clearSelection(): void {
    this.selectedItems = [];
    this.updateSelectionState();
  }

  // ===== PAGINATION =====
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get paginatedRecibos(): ReciboResponseDTO[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredRecibos.slice(startIndex, endIndex);
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getVisiblePages(): number[] {
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;
    const visiblePages: number[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        visiblePages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          visiblePages.push(i);
        }
        visiblePages.push(-1, totalPages);
      } else if (currentPage >= totalPages - 3) {
        visiblePages.push(1, -1);
        for (let i = totalPages - 4; i <= totalPages; i++) {
          visiblePages.push(i);
        }
      } else {
        visiblePages.push(1, -1);
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          visiblePages.push(i);
        }
        visiblePages.push(-1, totalPages);
      }
    }

    return visiblePages;
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
        parseInt(second, 10)
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
      currency: 'PEN'
    }).format(amount);
  }

  getNumeroRecibo(recibo: ReciboResponseDTO): string {
    if (recibo?.serie && recibo?.correlativo !== undefined && recibo?.correlativo !== null) {
      return `${recibo.serie}-${String(recibo.correlativo).padStart(9, '0')}`;
    }
    return 'Sin número';
  }

  trackByRecibo(index: number, recibo: ReciboResponseDTO): any {
    return recibo.id ?? index;
  }

  // ===== NUEVOS MÉTODOS PARA SELECCIÓN =====
  async cargarOpcionesCreacion(cotizacion: CotizacionResponse): Promise<void> {
    try {
      this.isLoading = true;

      // Cargar sucursales
      this.sucursales = await this.sucursalService.findAllSucursal().toPromise() || [];

      // Obtener personaId de la cotización (ID de tabla 'personas')
      // El backend tiene PersonaNaturalRepository.findByPersonasId() que convierte automáticamente
      if (cotizacion.personas?.id) {
        try {
          const personaId = cotizacion.personas.id;
          this.personaNaturalIdActual = personaId;

          // Cargar personas jurídicas asociadas
          // El backend convierte internamente de personas.id a persona_natural.id
          this.personasJuridicas = await this.naturalJuridicoService
            .findByPersonaNaturalId(personaId)
            .toPromise() || [];
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

      this.reciboService.createRecibo(
        this.cotizacionSeleccionada.id,
        personaJuridicaId,
        sucursalId
      ).subscribe({
        next: async (recibo: any) => {
          this.showSuccess('Recibo creado exitosamente');
          this.cerrarFormulario();
          // Redirigir al detalle en modo edición
          this.router.navigate(['/recibos/detalle', recibo.id], {
            queryParams: { modo: 'editar' }
          });
        },
        error: (error) => {
          const errorMsg = error.error?.message || error.message || 'Error al crear el recibo';
          this.showError(errorMsg);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } catch (error) {
      this.isLoading = false;
      this.showError('Error inesperado al crear el recibo');
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
