import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Services
import { ReciboService } from '../../core/service/Recibo/recibo.service';
import { PdfService } from '../../core/service/Pdf/Pdf.service';
import { DocumentoCobranzaService } from '../../core/service/DocumentoCobranza/DocumentoCobranza.service';
import { NaturalJuridicoService } from '../../core/service/NaturalJuridico/natural-juridico.service';
import { SucursalService } from '../../core/service/Sucursal/sucursal.service';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';

// Models
import { ReciboResponseDTO } from '../../shared/models/Recibo/recibo.model';
import { DocumentoCobranzaResponseDTO } from '../../shared/models/DocumetnoCobranza/documentoCobranza.model';
import { NaturalJuridicaResponse } from '../../shared/models/NaturalJuridica/naturalJuridica.models';
import { SucursalResponse } from '../../shared/models/Sucursal/sucursal.model';

// Components
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

/** Agrupa un DocumentoCobranza con sus recibos asociados */
interface DocumentoConRecibos {
  documento: DocumentoCobranzaResponseDTO;
  recibos: ReciboResponseDTO[];
  expanded: boolean;
  loadingRecibos: boolean;
}

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
  private documentoCobranzaService = inject(DocumentoCobranzaService);
  private naturalJuridicoService = inject(NaturalJuridicoService);
  private sucursalService = inject(SucursalService);

  // ===== UI STATE =====
  loading: boolean = false;
  isLoading = false;
  sidebarCollapsed = false;
  mostrarModalCrearRecibo = false;

  // ===== DATA ARRAYS =====
  documentosConRecibos: DocumentoConRecibos[] = [];
  filteredDocumentos: DocumentoConRecibos[] = [];
  personasJuridicas: NaturalJuridicaResponse[] = [];
  sucursales: SucursalResponse[] = [];

  // ===== SELECTION STATE =====
  documentoSeleccionado: DocumentoCobranzaResponseDTO | null = null;
  personaJuridicaSeleccionada: NaturalJuridicaResponse | null = null;
  sucursalSeleccionada: SucursalResponse | null = null;
  montoPago: number | null = null;

  // ===== SEARCH =====
  searchTerm = '';

  // ===== MESSAGES =====
  errorMessage: string = '';
  successMessage: string = '';
  showErrorMessage: boolean = false;
  showSuccessMessage: boolean = false;

  // ===== FORMS =====
  searchForm!: FormGroup;

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
  getTotalDocumentos(): number {
    return this.documentosConRecibos.length;
  }

  getTotalRecibos(): number {
    return this.documentosConRecibos.reduce((sum, d) => sum + d.recibos.length, 0);
  }

  getDocumentosPendientes(): number {
    return this.documentosConRecibos.filter(d =>
      (d.documento.saldoPendiente ?? 0) > 0
    ).length;
  }

  // ===== INITIALIZATION =====
  private initializeForms(): void {
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });

    this.searchForm.get('searchTerm')?.valueChanges.subscribe(value => {
      this.searchTerm = value;
      this.filterDocumentos();
    });
  }

  private async loadInitialData(): Promise<void> {
    this.loading = true;
    this.isLoading = true;
    try {
      await this.loadDocumentosConRecibos();
    } catch (error) {
      this.showError('Error al cargar los datos iniciales');
    } finally {
      this.loading = false;
      this.isLoading = false;
    }
  }

  // ===== DATA LOADING =====
  private async loadDocumentosConRecibos(): Promise<void> {
    try {
      const documentos = await this.documentoCobranzaService.getAllDocumentos().toPromise() || [];

      this.documentosConRecibos = documentos.map(doc => ({
        documento: doc,
        recibos: [],
        expanded: false,
        loadingRecibos: false
      }));

      this.filteredDocumentos = [...this.documentosConRecibos];
    } catch (error) {
      console.error('Error al cargar documentos:', error);
      this.showError('Error al cargar los documentos de cobranza');
      this.documentosConRecibos = [];
      this.filteredDocumentos = [];
    }
  }

  async toggleDocumento(item: DocumentoConRecibos): Promise<void> {
    item.expanded = !item.expanded;

    if (item.expanded && item.recibos.length === 0) {
      await this.loadRecibosForDocumento(item);
    }
  }

  private async loadRecibosForDocumento(item: DocumentoConRecibos): Promise<void> {
    if (!item.documento.id) return;

    item.loadingRecibos = true;
    try {
      const recibos = await this.reciboService
        .getRecibosByDocumentoCobranza(item.documento.id)
        .toPromise() || [];
      item.recibos = recibos;
    } catch (error) {
      // No recibos yet — that's ok
      item.recibos = [];
    } finally {
      item.loadingRecibos = false;
    }
  }

  // ===== REFRESH METHODS =====
  async actualizarDatos(): Promise<void> {
    this.loading = true;
    this.isLoading = true;
    try {
      await this.loadDocumentosConRecibos();
    } catch (error) {
      this.showError('Error al actualizar los datos');
    } finally {
      this.loading = false;
      this.isLoading = false;
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
      this.filteredDocumentos = [...this.documentosConRecibos];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredDocumentos = this.documentosConRecibos.filter(item =>
        item.documento.serie?.toLowerCase().includes(term) ||
        item.documento.correlativo?.toString().includes(term) ||
        item.documento.clienteNombre?.toLowerCase().includes(term) ||
        item.documento.codigoCotizacion?.toLowerCase().includes(term) ||
        this.getNumeroDocumento(item.documento).toLowerCase().includes(term)
      );
    }
  }

  // ===== CREAR RECIBO DESDE DOCUMENTO =====
  async abrirModalCrearRecibo(documento: DocumentoCobranzaResponseDTO): Promise<void> {
    this.documentoSeleccionado = documento;
    this.personaJuridicaSeleccionada = null;
    this.sucursalSeleccionada = null;
    this.montoPago = documento.saldoPendiente || documento.totalDeuda || 0;

    try {
      this.isLoading = true;
      this.sucursales = await this.sucursalService.getDropdownSucursales().toPromise() || [];

      // Cargar personas jurídicas si hay persona asociada
      if (documento.personaId) {
        try {
          this.personasJuridicas = await this.naturalJuridicoService
            .findByPersonaNaturalId(documento.personaId)
            .toPromise() || [];
        } catch {
          this.personasJuridicas = [];
        }
      } else {
        this.personasJuridicas = [];
      }

      this.mostrarModalCrearRecibo = true;
    } catch (error) {
      this.showError('Error al cargar opciones para el recibo');
    } finally {
      this.isLoading = false;
    }
  }

  cerrarModalCrearRecibo(): void {
    this.mostrarModalCrearRecibo = false;
    this.documentoSeleccionado = null;
    this.personaJuridicaSeleccionada = null;
    this.sucursalSeleccionada = null;
    this.personasJuridicas = [];
    this.sucursales = [];
    this.montoPago = null;
  }

  isMontoValido(): boolean {
    if (!this.documentoSeleccionado || this.montoPago === null || this.montoPago === undefined) {
      return false; // monto nulo no es válido
    }
    const maximoPagar = this.documentoSeleccionado.saldoPendiente || this.documentoSeleccionado.totalDeuda || 0;
    return this.montoPago > 0 && this.montoPago <= maximoPagar;
  }

  async confirmarCreacionRecibo(): Promise<void> {
    if (!this.documentoSeleccionado?.id) {
      this.showError('No se ha seleccionado un documento de cobranza');
      return;
    }

    try {
      this.isLoading = true;

      const personaJuridicaId = this.personaJuridicaSeleccionada?.personaJuridica?.id;
      const sucursalId = this.sucursalSeleccionada?.id;
      const monto = this.montoPago ?? undefined;

      this.reciboService.createRecibo(
        this.documentoSeleccionado.id,
        personaJuridicaId,
        sucursalId,
        monto
      ).subscribe({
        next: async (recibo: any) => {
          this.showSuccess('Recibo creado exitosamente');
          this.cerrarModalCrearRecibo();
          // Recargar datos para actualizar saldos
          await this.loadDocumentosConRecibos();
          // Navegar al detalle del recibo en modo edición
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

  // ===== NAVIGATION =====
  verDetalleRecibo(recibo: ReciboResponseDTO): void {
    if (recibo.id) {
      this.router.navigate(['/recibos/detalle', recibo.id]);
    }
  }

  editarRecibo(recibo: ReciboResponseDTO): void {
    if (recibo?.id) {
      this.router.navigate(['/recibos/detalle', recibo.id], {
        queryParams: { modo: 'editar' }
      });
    }
  }

  // ===== PDF METHODS =====
  descargarPDF(recibo: ReciboResponseDTO): void {
    if (!recibo.serie || !recibo.correlativo || !recibo.id) {
      this.showError('No se puede generar PDF: recibo sin datos válidos');
      return;
    }
    this.pdfService.downloadReciboPdf(recibo.id, recibo.serie, recibo.correlativo);
  }

  verPDF(recibo: ReciboResponseDTO): void {
    if (!recibo.id) {
      this.showError('No se puede visualizar PDF: recibo sin ID');
      return;
    }
    this.pdfService.viewReciboPdf(recibo.id);
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
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    const dateParts = dateString.split('T')[0].split('-');
    if (dateParts.length === 3) {
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10);
      const day = parseInt(dateParts[2], 10);
      const localDate = new Date(year, month - 1, day);
      return localDate.toLocaleDateString('es-ES');
    }
    return new Date(dateString).toLocaleDateString('es-ES');
  }

  formatCurrency(amount: number | undefined, moneda?: string): string {
    if (amount === undefined || amount === null) return 'S/ 0.00';
    const currency = moneda === 'USD' ? 'USD' : 'PEN';
    const prefix = currency === 'USD' ? '$ ' : 'S/ ';
    return prefix + amount.toFixed(2);
  }

  getNumeroDocumento(doc: DocumentoCobranzaResponseDTO): string {
    if (doc?.serie && doc?.correlativo !== undefined && doc?.correlativo !== null) {
      return `${doc.serie}-${String(doc.correlativo).padStart(9, '0')}`;
    }
    return 'Sin número';
  }

  getNumeroRecibo(recibo: ReciboResponseDTO): string {
    if (recibo?.serie && recibo?.correlativo !== undefined && recibo?.correlativo !== null) {
      return `${recibo.serie}-${String(recibo.correlativo).padStart(9, '0')}`;
    }
    return 'Sin número';
  }

  getSaldoClass(saldo: number | undefined): string {
    if (saldo === undefined || saldo === null) return 'text-gray-500';
    if (saldo <= 0) return 'text-green-600';
    return 'text-red-600';
  }

  getSaldoBadgeClass(saldo: number | undefined): string {
    if (saldo === undefined || saldo === null) return 'bg-gray-100 text-gray-600';
    if (saldo <= 0) return 'bg-green-100 text-green-700';
    return 'bg-red-100 text-red-700';
  }

  getSaldoLabel(saldo: number | undefined): string {
    if (saldo === undefined || saldo === null) return 'Sin datos';
    if (saldo <= 0) return 'PAGADO';
    return 'PENDIENTE';
  }

  getProgressPercent(doc: DocumentoCobranzaResponseDTO): number {
    const total = doc.totalDeuda ?? 0;
    const pagado = doc.totalPagado ?? 0;
    if (total <= 0) return 0;
    return Math.min(100, Math.round((pagado / total) * 100));
  }

  trackByDocumento(index: number, item: DocumentoConRecibos): any {
    return item.documento.id ?? index;
  }

  trackByRecibo(index: number, recibo: ReciboResponseDTO): any {
    return recibo.id ?? index;
  }
}
