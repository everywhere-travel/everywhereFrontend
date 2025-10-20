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
import { DocumentoCobranzaDTO, DocumentoCobranzaResponseDTO } from '../../shared/models/DocumetnoCobranza/documentoCobranza.model';
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
  documentos: DocumentoCobranzaResponseDTO[] = [];
  filteredDocumentos: DocumentoCobranzaResponseDTO[] = [];
  cotizaciones: CotizacionResponse[] = [];
  cotizacionesFiltradas: CotizacionResponse[] = [];

  // ===== SELECTION STATE =====
  documentoSeleccionado: DocumentoCobranzaResponseDTO | null = null;
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
      id: 'documentos-cobranza',
      title: 'Documentos de Cobranza',
      icon: 'fas fa-file-contract',
      route: '/documento-cobranza',
      active: true,
      moduleKey: 'DOCUMENTOS_COBRANZA'
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
      title: 'Documentos',
      icon: 'fas fa-file-alt',
      route: '/documentos',
      moduleKey: 'DOCUMENTOS'
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

  // ===== TEMPLATE UTILITIES =====
  Math = Math;

  constructor(private authService: AuthServiceService) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadInitialData();
    this.initializeSidebar();
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

  private initializeSidebar(): void {
    this.sidebarMenuItems = this.filterSidebarItems(this.allSidebarMenuItems);
  }

  private filterSidebarItems(items: ExtendedSidebarMenuItem[]): ExtendedSidebarMenuItem[] {
    const currentUser = this.authService.getUser();

    if (!currentUser || !currentUser.permissions) {
      return [];
    }

    // Si el usuario tiene permisos de ALL_MODULES, mostrar todo
    if (currentUser.permissions['ALL_MODULES']) {
      return items;
    }

    return items.filter(item => {
      // Si tiene moduleKey, verificar permisos directos
      if (item.moduleKey) {
        return currentUser.permissions[item.moduleKey] && currentUser.permissions[item.moduleKey].length > 0;
      }

      // Si no tiene moduleKey pero tiene children, verificar si algún hijo tiene permisos
      if (item.children && item.children.length > 0) {
        const filteredChildren = this.filterSidebarItems(item.children);
        if (filteredChildren.length > 0) {
          // Actualizar el item con solo los children filtrados
          item.children = filteredChildren;
          return true;
        }
        return false;
      }

      // Si no tiene moduleKey ni children, mostrar por defecto (como Dashboard)
      return true;
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

      this.documentos = await this.documentoCobranzaService.getAllDocumentos().toPromise() || [];
      console.log('Documentos recibidos del backend:', this.documentos);
      console.log('Primer documento estructura:', this.documentos[0]);
      if (this.documentos[0]) {
        console.log('Valor del total del primer documento:', this.documentos[0].total);
        console.log('Tipo del total:', typeof this.documentos[0].total);
      }
      this.filteredDocumentos = [...this.documentos];
      this.totalItems = this.documentos.length;
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
      this.cotizaciones = await this.cotizacionService.getAllCotizaciones().toPromise() || [];
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
      this.filteredDocumentos = this.documentos.filter(doc =>
        doc.numero?.toLowerCase().includes(term) ||
        doc.fileVenta?.toLowerCase().includes(term) ||
        doc.clienteNombre?.toLowerCase().includes(term) ||
        doc.codigoCotizacion?.toLowerCase().includes(term)
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
  verDetalleDocumento(documento: DocumentoCobranzaResponseDTO): void {
    if (documento.id) {
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

  private populateForm(documento: DocumentoCobranzaResponseDTO): void {
    this.documentoForm.patchValue({
      nroSerie: documento.numero,
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
        next: async (documento) => {
          this.showSuccess('Documento de cobranza creado exitosamente');
          await this.recargarDocumentos();
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
  descargarPDF(documento: DocumentoCobranzaResponseDTO): void {
    if (!documento.numero) {
      this.showError('No se puede generar PDF: documento sin número de serie');
      return;
    }

    const documentoId = documento.id;
    if (!documentoId) {
      this.showError('No se puede generar PDF: documento sin ID');
      return;
    }

    this.pdfService.downloadDocumentoCobranzaPdf(documentoId, documento.numero);
  }

  verPDF(documento: DocumentoCobranzaResponseDTO): void {
    const documentoId = documento.id;
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

  get paginatedDocumentos(): DocumentoCobranzaResponseDTO[] {
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

  trackByDocumento(index: number, documento: DocumentoCobranzaResponseDTO): string {
    return documento.numero || index.toString();
  }
}
