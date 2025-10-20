import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

// Services
import { DocumentoCobranzaService } from '../../core/service/DocumentoCobranza/DocumentoCobranza.service';
import { PdfService } from '../../core/service/Pdf/Pdf.service';
import { CotizacionService } from '../../core/service/Cotizacion/cotizacion.service';
import { AuthServiceService } from '../../core/service/auth/auth.service';

// Models
import { DocumentoCobranzaDTO } from '../../shared/models/DocumetnoCobranza/documentoCobranza.model';
import { CotizacionResponse } from '../../shared/models/Cotizacion/cotizacion.model';

// Components
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';

interface ExtendedSidebarMenuItem extends SidebarMenuItem {
  moduleKey?: string;
  children?: ExtendedSidebarMenuItem[];
}

@Component({
  selector: 'app-documento-cobranza',
  standalone: true,
  templateUrl: './documento-cobranza.component.html',
  styleUrls: ['./documento-cobranza.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SidebarComponent]
})
export class DocumentoCobranzaComponent implements OnInit, OnDestroy {

  // ===== SERVICES INJECTION =====
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private documentoCobranzaService = inject(DocumentoCobranzaService);
  private pdfService = inject(PdfService);
  private cotizacionService = inject(CotizacionService);

  // ===== UI STATE =====
  isLoading = false;
  sidebarCollapsed = false;
  currentView: 'table' | 'cards' | 'list' = 'table';
  mostrarModalCrear = false;
  mostrarModalVer = false;
  mostrarModalCotizaciones = false;
  mostrarFormulario = false;
  editandoDocumento = false;

  // ===== DATA ARRAYS =====
  documentos: DocumentoCobranzaDTO[] = [];
  filteredDocumentos: DocumentoCobranzaDTO[] = [];
  cotizaciones: CotizacionResponse[] = [];
  cotizacionesFiltradas: CotizacionResponse[] = [];

  // ===== SELECTION STATE =====
  documentoSeleccionado: DocumentoCobranzaDTO | null = null;
  cotizacionSeleccionada: CotizacionResponse | null = null;
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
      id: 'documentos-cobranza',
      title: 'Documentos de Cobranza',
      icon: 'fas fa-file-contract',
      route: '/documentos-cobranza',
      active: true,
      moduleKey: 'DOCUMENTOS_COBRANZA'
    }
  ];

  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

  // ===== TEMPLATE UTILITIES =====
  Math = Math;

  constructor(private authService: AuthServiceService) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions if needed
  }

  // ===== STATS METHODS =====
  getTotalDocumentos(): number {
    return this.documentos.length;
  }

  getDocumentosConPdf(): number {
    return this.documentos.filter(doc => doc.id).length; // Todos los documentos con ID tienen PDF disponible
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
      this.filterDocumentos();
    });
  }

  private async loadInitialData(): Promise<void> {
    this.isLoading = true;
    try {
      await this.loadDocumentos();
      await this.loadCotizaciones();
    } catch (error) {
      this.showError('Error al cargar los datos iniciales');
    } finally {
      this.isLoading = false;
    }
  }

  // ===== DATA LOADING =====
  private async loadDocumentos(): Promise<void> {
    try {
      this.documentoCobranzaService.getAllDocumentos().subscribe({
        next: (documentos) => {
          this.documentos = documentos;
          this.filteredDocumentos = [...documentos];
          this.totalItems = documentos.length;
        },
        error: (error) => {
          console.error('Error al cargar documentos:', error);
          this.showError('Error al cargar los documentos de cobranza');
        }
      });
    } catch (error) {
      console.error('Error en loadDocumentos:', error);
    }
  }

  private async loadCotizaciones(): Promise<void> {
    try {
      this.cotizacionService.getAllCotizaciones().subscribe({
        next: (cotizaciones) => {
          this.cotizaciones = cotizaciones;
          this.cotizacionesFiltradas = [...cotizaciones];
        },
        error: (error) => {
          console.error('Error al cargar cotizaciones:', error);
        }
      });
    } catch (error) {
      console.error('Error en loadCotizaciones:', error);
    }
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
      this.filteredDocumentos = this.documentos.filter(doc =>
        doc.nroSerie?.toLowerCase().includes(term) ||
        doc.fileVenta?.toLowerCase().includes(term) ||
        doc.clienteNombre?.toLowerCase().includes(term) ||
        doc.clienteDocumento?.toLowerCase().includes(term)
      );
    }
    this.totalItems = this.filteredDocumentos.length;
    this.currentPage = 1;
  }

  // ===== VIEW METHODS =====
  changeView(view: 'table' | 'cards' | 'list'): void {
    this.currentView = view;
  }

  // ===== NAVIGATION METHODS =====
  verDetalleDocumento(documento: DocumentoCobranzaDTO): void {
    if (documento.id) {
      this.router.navigate(['/documentos-cobranza/detalle', documento.id]);
    }
  }

  // ===== MODAL METHODS =====
  mostrarModalVerDocumento(documento: DocumentoCobranzaDTO): void {
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
    await this.loadCotizaciones();
    this.mostrarModalCotizaciones = true;
  }

  async mostrarFormularioEditar(documento: DocumentoCobranzaDTO): Promise<void> {
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

  private populateForm(documento: DocumentoCobranzaDTO): void {
    this.documentoForm.patchValue({
      nroSerie: documento.nroSerie,
      fileVenta: documento.fileVenta,
      costoEnvio: documento.costoEnvio,
      fechaEmision: documento.fechaEmision ? documento.fechaEmision.split('T')[0] : '',
      clienteEmail: documento.clienteEmail,
      clienteTelefono: documento.clienteTelefono,
      clienteNombre: documento.clienteNombre,
      clienteDocumento: documento.clienteDocumento,
      sucursalDescripcion: documento.sucursalDescripcion,
      puntoCompra: documento.puntoCompra,
      moneda: documento.moneda,
      formaPago: documento.formaPago,
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
    await this.crearDocumentoDesdeCotizacion(cotizacion);
  }

  cancelarSeleccionCotizacion(): void {
    this.mostrarModalCotizaciones = false;
    this.cotizacionSeleccionada = null;
  }

  // ===== CRUD OPERATIONS =====
  async crearDocumentoDesdeCotizacion(cotizacion: CotizacionResponse): Promise<void> {
    try {
      this.isLoading = true;

      // Default values for creation
      const fileVenta = `FILE-${cotizacion.codigoCotizacion}`;
      const costoEnvio = 0;

      this.documentoCobranzaService.createDocumentoCobranza(
        cotizacion.id,
        fileVenta,
        costoEnvio
      ).subscribe({
        next: (documento) => {
          this.showSuccess('Documento de cobranza creado exitosamente');
          this.loadDocumentos();
          this.cerrarFormulario();
        },
        error: (error) => {
          console.error('Error al crear documento:', error);
          this.showError('Error al crear el documento de cobranza');
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } catch (error) {
      this.isLoading = false;
      this.showError('Error inesperado al crear el documento');
    }
  }

  // ===== PDF METHODS =====
  descargarPDF(documento: DocumentoCobranzaDTO): void {
    if (!documento.nroSerie) {
      this.showError('No se puede generar PDF: documento sin número de serie');
      return;
    }

    // Assuming the documento has an ID field
    const documentoId = (documento as any).id;
    if (!documentoId) {
      this.showError('No se puede generar PDF: documento sin ID');
      return;
    }

    this.pdfService.downloadDocumentoCobranzaPdf(documentoId, documento.nroSerie);
  }

  verPDF(documento: DocumentoCobranzaDTO): void {
    const documentoId = (documento as any).id;
    if (!documentoId) {
      this.showError('No se puede visualizar PDF: documento sin ID');
      return;
    }

    this.pdfService.viewDocumentoCobranzaPdf(documentoId);
  }

  // ===== SELECTION METHODS =====
  toggleAllSelection(): void {
    if (this.allSelected) {
      this.selectedItems = [];
    } else {
      this.selectedItems = this.filteredDocumentos
        .map(doc => (doc as any).id)
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
    this.allSelected = this.selectedItems.length === this.filteredDocumentos.length && this.filteredDocumentos.length > 0;
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

  get paginatedDocumentos(): DocumentoCobranzaDTO[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredDocumentos.slice(startIndex, endIndex);
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

  onSidebarItemClick(item: SidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  // ===== UTILITY METHODS =====
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
  }

  formatDateTime(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-ES');
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return 'S/ 0.00';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  }

  trackByDocumento(index: number, documento: DocumentoCobranzaDTO): string {
    return documento.nroSerie || index.toString();
  }
}
