import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ViajeroService } from '../../core/service/viajero/viajero.service';
import { ViajeroRequest, ViajeroResponse, ViajeroConPersonaNatural } from '../../shared/models/Viajero/viajero.model';
import { DocumentoService } from '../../core/service/Documento/documento.service';
import { DetalleDocumentoService } from '../../core/service/DetalleDocumento/detalle-documento.service';
import { DocumentoResponse } from '../../shared/models/Documento/documento.model';
import { DetalleDocumentoRequest, DetalleDocumentoResponse } from '../../shared/models/Documento/detalleDocumento.model';
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';
import { LucideAngularModule, FilePlus, FileText, File, FileCheck, CreditCard } from 'lucide-angular';
import { AuthServiceService } from '../../core/service/auth/auth.service';

// Extender la interfaz para agregar moduleKey
interface ExtendedSidebarMenuItem extends SidebarMenuItem {
  moduleKey?: string;
  children?: ExtendedSidebarMenuItem[];
}
// Interfaces for export functionality
interface ExportedViajero {
  id: number;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  clasificacionEdad: 'Adulto' | 'Niño' | 'Infante';
  fechaNacimiento: string;
  telefono: string;
  email: string;
  documentos: DetalleDocumentoResponse[];
  documentoSeleccionado?: DetalleDocumentoResponse;
  viajeroOriginal: ViajeroResponse;
}

@Component({
  selector: 'app-viajero',
  standalone: true,
  templateUrl: './viajero.component.html',
  styleUrls: ['./viajero.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SidebarComponent,
    LucideAngularModule
  ]
})
export class ViajeroComponent implements OnInit {

  // Sidebar Configuration
  sidebarCollapsed = false;
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
      active: true,
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
      id: 'liquidaciones',
      title: 'Liquidaciones',
      icon: 'fas fa-credit-card',
      route: '/liquidaciones',
      moduleKey: 'LIQUIDACIONES'
    },
    {
      id: 'documentos',
      title: 'Documentos de clientes',
      icon: 'fas fa-file-alt',
      route: '/documentos',
      moduleKey: 'DOCUMENTOS'
    },
    {
      id: 'documentos-cobranza',
      title: 'Documentos de Cobranza',
      icon: 'fas fa-file-contract',
      route: '/documento-cobranza',
      moduleKey: 'DOCUMENTOS_COBRANZA'
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

    // Data Arrays
  viajeros: ViajeroResponse[] = [];
  viajerosFiltrados: ViajeroResponse[] = [];

  // Loading state
  loading: boolean = false;
  isLoading = false;

  // Search and filters
  searchQuery = '';
  filtroTipo = 'todos';

  // View management
  currentView: 'table' | 'cards' | 'list' = 'table';

  // Selection management
  selectedItems: number[] = [];

  // Action menus
  showActionMenu: number | null = null;
  showActionMenuCards: number | null = null;
  showActionMenuList: number | null = null;

  // Sorting
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Statistics
  estadisticas = {
    totalNacionalidades: 0,
    documentosVenciendo: 0
  };

  // Modal states
  mostrarModalEliminar = false;
  viajeroAEliminar: ViajeroResponse | null = null;
  mostrarModalEliminarMultiple = false;
  mostrarModalDetalles = false;
  viajeroDetalles: ViajeroResponse | null = null;
  documentosViajero: DetalleDocumentoResponse[] = [];
  cargandoDocumentos = false;
  mostrarModalCrearViajero = false;
  editandoViajero: ViajeroResponse | null = null;
  isSubmitting = false;

  // Export functionality
  mostrarModalExportar = false;
  viajerosProcesados: ExportedViajero[] = [];
  exportandoViajeros = false;
  copiandoTexto = false;
  ultimoTextoCopiado = '';

  // Form
  viajeroForm: FormGroup;

  // Modal de asignación de documentos
  mostrarModalAsignarDocumento = false;
  viajeroParaDocumento: ViajeroResponse | null = null;
  documentosDisponibles: DocumentoResponse[] = [];
  documentoForm: FormGroup;
  isSubmittingDocumento = false;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Math object for template use
  Math = Math;

  // Lucide icons for template use
  FilePlusIcon = FilePlus;
  FileTextIcon = FileText;
  FileIcon = File;
  FileCheckIcon = FileCheck;
  CreditCardIcon = CreditCard;

  constructor(
    private viajeroService: ViajeroService,
    private documentoService: DocumentoService,
    private detalleDocumentoService: DetalleDocumentoService,
    private router: Router,
    private authService: AuthServiceService,
    private formBuilder: FormBuilder
  ) {
    this.viajeroForm = this.createViajeroForm();
    this.documentoForm = this.createDocumentoForm();
  }

  ngOnInit(): void {
    this.initializeSidebar();
    this.loadViajeros();
    this.loadDocumentos();
  }

  // =================================================================
  // SIDEBAR FILTERING
  // =================================================================

  private initializeSidebar(): void {
    const authData = this.authService.getUser();
    const userPermissions = authData?.permissions || {};

    // Si tiene ALL_MODULES, mostrar todos los items, sino filtrar por permisos específicos
    if (userPermissions['ALL_MODULES']) {
      this.sidebarMenuItems = this.allSidebarMenuItems;
    } else {
      this.sidebarMenuItems = this.filterSidebarItems(this.allSidebarMenuItems, userPermissions);
    }
  }

  private filterSidebarItems(items: ExtendedSidebarMenuItem[], userPermissions: any): ExtendedSidebarMenuItem[] {
    return items.filter(item => {
      // Dashboard siempre visible
      if (item.id === 'dashboard') {
        return true;
      }

      // Items sin moduleKey (como configuración, reportes) siempre visibles
      if (!item.moduleKey) {
        // Si tiene children, filtrar los children
        if (item.children) {
          const filteredChildren = this.filterSidebarItems(item.children, userPermissions);
          // Solo mostrar el padre si tiene al menos un hijo visible
          if (filteredChildren.length > 0) {
            return {
              ...item,
              children: filteredChildren
            };
          }
          return false;
        }
        return true;
      }

      // Verificar si el usuario tiene permisos para este módulo
      const hasPermission = Object.keys(userPermissions).includes(item.moduleKey);

      if (hasPermission) {
        // Si tiene children, filtrar los children también
        if (item.children) {
          const filteredChildren = this.filterSidebarItems(item.children, userPermissions);
          return {
            ...item,
            children: filteredChildren
          };
        }
        return true;
      }

      return false;
    }).map(item => {
      // Asegurar que los children filtrados se apliquen correctamente
      if (item.children) {
        return {
          ...item,
          children: this.filterSidebarItems(item.children, userPermissions)
        };
      }
      return item;
    }).filter(item => {
      // Filtrar items padre que no tengan children después del filtrado
      if (item.children) {
        return item.children.length > 0;
      }
      return true;
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

  // Load data
  loadViajeros(): void {
    this.loading = true;
    this.isLoading = true;

    this.viajeroService.findAll().subscribe({
      next: (data) => {
        this.viajeros = data;
        this.aplicarFiltros();
        this.calcularEstadisticas();
        this.loading = false;
        this.isLoading = false;
      },
      error: (error) => {
        this.loading = false;
        this.isLoading = false;
      }
    });
  }

  // Statistics calculation
  calcularEstadisticas(): void {
    const nacionalidades = new Set(this.viajeros.map(v => v.nacionalidad));
    this.estadisticas.totalNacionalidades = nacionalidades.size;

    // Los documentos próximos a vencer ahora se manejan en DetalleDocumento
    this.estadisticas.documentosVenciendo = 0;
  }

  // Search and filter methods
  onSearchChange(): void {
    this.aplicarFiltros();
  }

  aplicarFiltroTipo(tipo: string): void {
    this.filtroTipo = tipo;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let filtrados = [...this.viajeros];

    // Aplicar búsqueda
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtrados = filtrados.filter(viajero =>
        viajero.fechaNacimiento?.toLowerCase().includes(query) ||
        viajero.nacionalidad?.toLowerCase().includes(query) ||
        viajero.residencia?.toLowerCase().includes(query)
      );
    }

    // Aplicar filtro por tipo - Esta funcionalidad se movió a DetalleDocumento
    // Los filtros por vencimiento de documento ahora se manejan separadamente

    this.viajerosFiltrados = filtrados;
    this.calcularEstadisticas();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.aplicarFiltros();
  }

  clearAllFilters(): void {
    this.searchQuery = '';
    this.filtroTipo = 'todos';
    this.aplicarFiltros();
  }

  getFiltroLabel(tipo: string): string {
    switch (tipo) {
      case 'vencimiento-proximo':
        return 'Documentos por Vencer';
      default:
        return 'Todos';
    }
  }

  // View management
  changeView(view: 'table' | 'cards' | 'list'): void {
    this.currentView = view;
    this.closeAllMenus();
  }

  isActiveView(view: string): boolean {
    return this.currentView === view;
  }

  // Selection management
  toggleSelection(viajeroId: number): void {
    const index = this.selectedItems.indexOf(viajeroId);
    if (index > -1) {
      this.selectedItems.splice(index, 1);
    } else {
      this.selectedItems.push(viajeroId);
    }
  }

  toggleAllSelection(): void {
    if (this.allSelected) {
      this.selectedItems = [];
    } else {
      this.selectedItems = this.viajerosFiltrados.map(v => v.id);
    }
  }

  isSelected(viajeroId: number): boolean {
    return this.selectedItems.includes(viajeroId);
  }

  get allSelected(): boolean {
    return this.viajerosFiltrados.length > 0 && this.selectedItems.length === this.viajerosFiltrados.length;
  }

  get someSelected(): boolean {
    return this.selectedItems.length > 0 && this.selectedItems.length < this.viajerosFiltrados.length;
  }

  clearSelection(): void {
    this.selectedItems = [];
  }

  // Action menu management
  toggleActionMenu(viajeroId: number): void {
    this.showActionMenuCards = null;
    this.showActionMenuList = null;
    this.showActionMenu = this.showActionMenu === viajeroId ? null : viajeroId;
  }

  toggleActionMenuCards(viajeroId: number): void {
    this.showActionMenu = null;
    this.showActionMenuList = null;
    this.showActionMenuCards = this.showActionMenuCards === viajeroId ? null : viajeroId;
  }

  toggleActionMenuList(viajeroId: number): void {
    this.showActionMenu = null;
    this.showActionMenuCards = null;
    this.showActionMenuList = this.showActionMenuList === viajeroId ? null : viajeroId;
    this.showActionMenu = null;
    this.showActionMenuCards = null;
    this.showActionMenuList = this.showActionMenuList === viajeroId ? null : viajeroId;
  }

  closeAllMenus(): void {
    this.showActionMenu = null;
    this.showActionMenuCards = null;
    this.showActionMenuList = null;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;

    if (!target.closest('.action-menu-container') && !target.closest('[data-action-menu]')) {
      this.closeAllMenus();
    }
  }

  // CRUD operations
  verViajero(viajero: ViajeroResponse): void {
    this.viajeroDetalles = viajero;
    this.documentosViajero = [];
    this.cargandoDocumentos = true;
    this.mostrarModalDetalles = true;

    /* Cargar documentos del viajero
    this.detalleDocumentoService.findByViajero(viajero.id).subscribe({
      next: (documentos) => {
        this.documentosViajero = documentos;
        this.cargandoDocumentos = false;
      },
      error: (error) => {
        console.error('Error al cargar documentos del viajero:', error);
        this.cargandoDocumentos = false;
      }
    });*/

    this.closeAllMenus();
  }

  editarViajero(viajero: ViajeroResponse): void {
    this.editandoViajero = viajero;
    this.populateFormWithViajero(viajero);
    this.mostrarModalCrearViajero = true;
    this.closeAllMenus();
  }

  confirmarEliminar(viajero: ViajeroResponse): void {
    this.viajeroAEliminar = viajero;
    this.mostrarModalEliminar = true;
    this.closeAllMenus();
  }

  confirmarEliminacionModal(): void {
    if (this.viajeroAEliminar) {
      this.viajeroService.deleteById(this.viajeroAEliminar.id).subscribe({
        next: () => {
          this.cerrarModalEliminar();
          this.loadViajeros();
        },
        error: (error) => {
          this.cerrarModalEliminar();
        }
      });
    }
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.viajeroAEliminar = null;
  }

  cerrarModalEliminarMultiple(): void {
    this.mostrarModalEliminarMultiple = false;
  }

  abrirModalCrearViajero(): void {
    this.editandoViajero = null;
    this.viajeroForm.reset();
    this.mostrarModalCrearViajero = true;
  }

  // Bulk operations
  editarSeleccionados(): void {
    if (this.selectedItems.length === 0) return;

    if (this.selectedItems.length === 1) {
      // Si solo hay uno seleccionado, abrir editor individual
      const viajero = this.viajeros.find(v => v.id === this.selectedItems[0]);
      if (viajero) {
        this.editarViajero(viajero);
      }
    } else {
      // Para múltiples elementos, mostrar mensaje que solo se puede editar uno a la vez
      alert('Solo se puede editar un viajero a la vez. Por favor, selecciona solo un viajero para editar.');
    }
  }

  eliminarSeleccionados(): void {
    if (this.selectedItems.length === 0) return;

    // Mostrar modal de confirmación múltiple
    this.mostrarModalEliminarMultiple = true;
  }

  // Método para eliminar múltiples viajeros desde el modal
  confirmarEliminacionMultiple(): void {
    if (this.selectedItems.length === 0) return;

    this.isLoading = true;
    let eliminados = 0;
    const total = this.selectedItems.length;

    this.selectedItems.forEach(id => {
      this.viajeroService.deleteById(id).subscribe({
        next: () => {
          eliminados++;
          if (eliminados === total) {
            this.loadViajeros();
            this.clearSelection();
            this.isLoading = false;
            this.cerrarModalEliminarMultiple();
          }
        },
        error: (error) => {
          eliminados++;
          if (eliminados === total) {
            this.loadViajeros();
            this.clearSelection();
            this.isLoading = false;
            this.cerrarModalEliminarMultiple();
          }
        }
      });
    });
  }

  getNacionalidadFlag(nacionalidad: string): string {
    // Mapeo básico de nacionalidades a emojis de banderas
    const flags: { [key: string]: string } = {
      'Peruana': '🇵🇪',
      'Colombiana': '🇨🇴',
      'Ecuatoriana': '🇪🇨',
      'Brasileña': '🇧🇷',
      'Argentina': '🇦🇷',
      'Chilena': '🇨🇱',
      'Venezolana': '🇻🇪',
      'Boliviana': '🇧🇴',
      'Uruguaya': '🇺🇾',
      'Paraguaya': '🇵🇾',
      'Española': '🇪🇸',
      'Italiana': '🇮🇹',
      'Francesa': '🇫🇷',
      'Alemana': '🇩🇪',
      'Estadounidense': '🇺🇸',
      'Canadiense': '🇨🇦',
      'Mexicana': '🇲🇽',
      'China': '🇨🇳',
      'Japonesa': '🇯🇵',
      'Coreana': '🇰🇷'
    };
    return flags[nacionalidad] || '🌍';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getDiasHastaVencimiento(fechaVencimiento: string): string {
    if (!fechaVencimiento) return '';

    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diferencia = vencimiento.getTime() - hoy.getTime();
    const dias = Math.ceil(diferencia / (1000 * 3600 * 24));

    if (dias < 0) {
      return `Vencido hace ${Math.abs(dias)} días`;
    } else if (dias === 0) {
      return 'Vence hoy';
    } else if (dias === 1) {
      return 'Vence mañana';
    } else if (dias <= 30) {
      return `Vence en ${dias} días`;
    } else {
      return `${dias} días restantes`;
    }
  }


  // Track by functions
  trackByViajeroId(index: number, viajero: ViajeroResponse): number {
    return viajero.id;
  }



  // Form methods
  private createViajeroForm(): FormGroup {
    return this.formBuilder.group({
      nombres: [''],
      apellidoPaterno: [''],
      apellidoMaterno: [''],
      fechaNacimiento: [''],
      nacionalidad: [''],
      residencia: [''],
      persona: this.formBuilder.group({
        email: [''],
        telefono: [''],
        direccion: ['']
      })
    });
  }

  // Refresh data
  refreshData(): void {
    this.loadViajeros();
  }

  // Documento form methods
  private createDocumentoForm(): FormGroup {
    return this.formBuilder.group({
      documentoId: ['', Validators.required],
      numero: ['', Validators.required],
      fechaEmision: ['', Validators.required],
      fechaVencimiento: ['', Validators.required],
      origen: ['', Validators.required]
    });
  }

  // Load documentos
  loadDocumentos(): void {
    this.documentoService.getAllDocumentos().subscribe({
      next: (documentos) => {
        this.documentosDisponibles = documentos;
      },
      error: (error) => {
        console.error('Error al cargar documentos:', error);
      }
    });
  }

  // Modal de asignación de documentos
  abrirModalAsignarDocumento(viajero: ViajeroResponse): void {
    this.viajeroParaDocumento = viajero;
    this.documentoForm.reset();
    this.mostrarModalAsignarDocumento = true;
  }

  cerrarModalAsignarDocumento(): void {
    this.mostrarModalAsignarDocumento = false;
    this.viajeroParaDocumento = null;
    this.documentoForm.reset();
  }

  onSubmitDocumento(): void {
    if (this.documentoForm.invalid || !this.viajeroParaDocumento) {
      Object.keys(this.documentoForm.controls).forEach(key => {
        this.documentoForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmittingDocumento = true;
    const formData = this.documentoForm.value;

    const detalleDocumentoRequest: DetalleDocumentoRequest = {
      numero: formData.numero,
      fechaEmision: formData.fechaEmision,
      fechaVencimiento: formData.fechaVencimiento,
      origen: formData.origen,
      documentoId: formData.documentoId,
      viajeroId: this.viajeroParaDocumento.id
    };

    this.detalleDocumentoService.saveDetalle(detalleDocumentoRequest).subscribe({
      next: (response) => {
        this.isSubmittingDocumento = false;
        this.cerrarModalAsignarDocumento();
        // Aquí podrías mostrar una notificación de éxito
        console.log('Documento asignado exitosamente:', response);
      },
      error: (error) => {
        this.isSubmittingDocumento = false;
        console.error('Error al asignar documento:', error);
        // Aquí podrías mostrar una notificación de error
      }
    });
  }

  // Export data
  exportarDatos(): void {
    // Implementar exportación de datos
    const csvData = this.convertToCSV(this.viajerosFiltrados);
    this.downloadCSV(csvData, 'viajeros.csv');
  }

  private convertToCSV(data: ViajeroResponse[]): string {
    const headers = ['Nombres', 'Apellido Paterno', 'Apellido Materno', 'Documento', 'Nacionalidad', 'Residencia', 'Email', 'Teléfono'];
    const csvContent = [headers.join(',')];

    data.forEach(viajero => {
      const row = [
        viajero.fechaNacimiento || '',
        viajero.nacionalidad || '',
        viajero.residencia || '',
      ];
      csvContent.push(row.join(','));
    });

    return csvContent.join('\n');
  }

  private downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Utility methods for UI
  hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.filtroTipo !== 'todos');
  }

  onItemsPerPageChange(): void {
    this.itemsPerPage = Number(this.itemsPerPage);
    this.currentPage = 1;
    this.calcularEstadisticas();
  }

  getEmptyStateTitle(): string {
    if (this.searchQuery) {
      return 'No se encontraron resultados';
    }
    if (this.filtroTipo !== 'todos') {
      return `No hay viajeros con ${this.getFiltroLabel(this.filtroTipo).toLowerCase()}`;
    }
    return 'No hay viajeros registrados';
  }

  getEmptyStateMessage(): string {
    if (this.searchQuery) {
      return `No hay resultados para "${this.searchQuery}". Intenta con otros términos de búsqueda.`;
    }
    if (this.filtroTipo !== 'todos') {
      return `No hay viajeros que cumplan con el filtro ${this.getFiltroLabel(this.filtroTipo).toLowerCase()}.`;
    }
    return 'Comienza creando tu primer viajero. Haz clic en "Nuevo Viajero" para empezar.';
  }

  // Método para poblar el formulario con datos del viajero
  populateFormWithViajero(viajero: ViajeroResponse): void {
    this.viajeroForm.patchValue({
      fechaNacimiento: viajero.fechaNacimiento || '',
      nacionalidad: viajero.nacionalidad || '',
      residencia: viajero.residencia || ''
    });
  }

  // Método para cerrar modal de detalles
  cerrarModalDetalles(): void {
    this.mostrarModalDetalles = false;
    this.viajeroDetalles = null;
  }

  // Método para cerrar modal de crear/editar
  cerrarModalCrearViajero(): void {
    this.mostrarModalCrearViajero = false;
    this.editandoViajero = null;
    this.viajeroForm.reset();

    // Resetear el formulario a valores por defecto
    this.viajeroForm.patchValue({
      tipoDocumento: 'DNI',
      nacionalidad: 'Peruana'
    });
  }

  // Método para manejar el envío del formulario
  onSubmitViajero(): void {
    if (this.viajeroForm.invalid) {
      Object.keys(this.viajeroForm.controls).forEach(key => {
        this.viajeroForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    const formData = this.viajeroForm.value;

    const viajeroRequest: ViajeroRequest = {
      fechaNacimiento: formData.fechaNacimiento,
      nacionalidad: formData.nacionalidad,
      residencia: formData.residencia,
    };

    if (this.editandoViajero) {
      // Actualizar viajero existente

      this.viajeroService.update(this.editandoViajero.id, viajeroRequest).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.cerrarModalCrearViajero();
          this.loadViajeros();
          // Aquí podrías agregar una notificación de éxito
        },
        error: (error) => {
          this.isSubmitting = false;
          // Aquí podrías agregar una notificación de error
        }
      });
    } else {
      // Crear nuevo viajero

      this.viajeroService.save(viajeroRequest).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.cerrarModalCrearViajero();
          this.loadViajeros();
          // Aquí podrías agregar una notificación de éxito
        },
        error: (error) => {
          this.isSubmitting = false;
          // Aquí podrías agregar una notificación de error
        }
      });
    }
  }

  // Pagination
  get paginatedViajeros(): ViajeroResponse[] {
    const itemsPerPageNum = Number(this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * itemsPerPageNum;
    const endIndex = startIndex + itemsPerPageNum;
    return this.viajerosFiltrados.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    const itemsPerPageNum = Number(this.itemsPerPage);
    return Math.ceil(this.totalItems / itemsPerPageNum);
  }

  // Métodos para paginación (remover el getter duplicado)
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getVisiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2;

    let start = Math.max(1, current - delta);
    let end = Math.min(total, current + delta);

    if (end - start < 2 * delta) {
      if (start === 1) {
        end = Math.min(total, start + 2 * delta);
      } else if (end === total) {
        start = Math.max(1, end - 2 * delta);
      }
    }

    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // =================================================================
  // EXPORT FUNCTIONALITY
  // =================================================================

  /**
   * Abre el modal de exportación de viajeros seleccionados

  async exportarViajeros(): Promise<void> {
    if (this.selectedItems.length === 0) {
      return;
    }

    this.exportandoViajeros = true;

    try {
      // Llamada real al backend
      this.viajeroService.exportViajeros(this.selectedItems).subscribe({
        next: async (viajerosExportados) => {
          this.viajerosProcesados = await this.procesarViajeros(viajerosExportados);
          this.exportandoViajeros = false;
          this.mostrarModalExportar = true;
        },
        error: async (error) => {
          console.error('Error al exportar viajeros:', error);
          // Fallback: procesar localmente si falla el backend
          const viajerosFiltrados = this.viajeros.filter(v => this.selectedItems.includes(v.id));
          this.viajerosProcesados = await this.procesarViajeros(viajerosFiltrados);
          this.exportandoViajeros = false;
          this.mostrarModalExportar = true;
        }
      });
    } catch (error) {
      console.error('Error en exportación:', error);
      this.exportandoViajeros = false;
    }
  } */

  /**
   * Remover tildes y caracteres especiales de un texto
   */
  private removerTildes(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ñ/g, 'n')
      .replace(/Ñ/g, 'N');
  }

  /**
   * Convierte nombres y apellidos a mayúsculas sin tildes para exportación
   */
  private formatearNombreParaExportacion(texto: string): string {
    return this.removerTildes(texto).toUpperCase();
  }

  /**
   * Procesa y clasifica los viajeros según las especificaciones

  private async procesarViajeros(viajeros: ViajeroResponse[]): Promise<ExportedViajero[]> {
    const procesados: ExportedViajero[] = [];

    for (const viajero of viajeros) {
      try {
        // Cargar documentos del viajero
        const documentos = await this.detalleDocumentoService.findByViajero(viajero.id).toPromise() || [];

        const edad = this.calcularEdad(viajero.fechaNacimiento);
        const clasificacion = this.clasificarPorEdad(edad);

        // Formatear nombres para exportación (mayúsculas sin tildes)
        const nombresFormateados = this.formatearNombreParaExportacion(viajero.nombres);
        const apellidosFormateados = `${this.formatearNombreParaExportacion(viajero.apellidoPaterno)} ${this.formatearNombreParaExportacion(viajero.apellidoMaterno)}`.trim();
        const nombreCompletoFormateado = `${nombresFormateados} ${apellidosFormateados}`.trim();

        const viajeroExportado: ExportedViajero = {
          id: viajero.id,
          nombres: nombresFormateados,
          apellidos: apellidosFormateados,
          nombreCompleto: nombreCompletoFormateado,
          clasificacionEdad: clasificacion,
          fechaNacimiento: this.formatDateForExport(viajero.fechaNacimiento),
          telefono: viajero.persona?.telefono || 'N/A',
          email: viajero.persona?.email || 'vmroxana28@gmail.com',
          documentos: documentos,
          documentoSeleccionado: documentos.length > 0 ? documentos[0] : undefined,
          viajeroOriginal: viajero
        };

        procesados.push(viajeroExportado);
      } catch (error) {
        console.error(`Error al cargar documentos del viajero ${viajero.id}:`, error);
        // Continuar con el procesamiento sin documentos
        const edad = this.calcularEdad(viajero.fechaNacimiento);
        const clasificacion = this.clasificarPorEdad(edad);

        const nombresFormateados = this.formatearNombreParaExportacion(viajero.nombres);
        const apellidosFormateados = `${this.formatearNombreParaExportacion(viajero.apellidoPaterno)} ${this.formatearNombreParaExportacion(viajero.apellidoMaterno)}`.trim();
        const nombreCompletoFormateado = `${nombresFormateados} ${apellidosFormateados}`.trim();

        const viajeroExportado: ExportedViajero = {
          id: viajero.id,
          nombres: nombresFormateados,
          apellidos: apellidosFormateados,
          nombreCompleto: nombreCompletoFormateado,
          clasificacionEdad: clasificacion,
          fechaNacimiento: this.formatDateForExport(viajero.fechaNacimiento),
          telefono: viajero.persona?.telefono || 'N/A',
          email: viajero.persona?.email || 'vmroxana28@gmail.com',
          documentos: [],
          documentoSeleccionado: undefined,
          viajeroOriginal: viajero
        };

        procesados.push(viajeroExportado);
      }
    }

    // Ordenar según especificaciones: Adultos -> Niños -> Infantes
    return procesados.sort((a, b) => {
      const ordenPrioridad = { 'Adulto': 1, 'Niño': 2, 'Infante': 3 };
      return ordenPrioridad[a.clasificacionEdad] - ordenPrioridad[b.clasificacionEdad];
    });
  }
*/
  /**
   * Calcula la edad en años a partir de una fecha de nacimiento
   */
  private calcularEdad(fechaNacimiento: string): number {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad;
  }

  /**
   * Clasifica al viajero por edad según las especificaciones
   */
  private clasificarPorEdad(edad: number): 'Adulto' | 'Niño' | 'Infante' {
    if (edad < 2) {
      return 'Infante';
    } else if (edad <= 11) {
      return 'Niño';
    } else {
      return 'Adulto';
    }
  }

  /**
   * Formatea fecha para exportación (dd/mm/yyyy)
   */
  private formatDateForExport(fecha: string): string {
    const date = new Date(fecha);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Cambia el documento seleccionado para un viajero en la exportación
   */
  seleccionarDocumento(viajero: ExportedViajero, documento: DetalleDocumentoResponse): void {
    viajero.documentoSeleccionado = documento;
  }

  /**
   * Obtiene el texto del documento para mostrar en el dropdown
   */
  getDocumentoDisplay(documento: DetalleDocumentoResponse): string {
    return `${documento.documento.tipo}: ${documento.numero}`;
  }

  /**
   * Obtiene la información del documento para copiar
   */
  getDocumentoInfo(viajero: ExportedViajero): string {
    if (!viajero.documentoSeleccionado) {
      return 'Sin documento';
    }
    return `${viajero.documentoSeleccionado.documento.tipo}: ${viajero.documentoSeleccionado.numero}`;
  }

  /**
   * Copia la información del documento seleccionado
   */
  async copiarDocumento(viajero: ExportedViajero): Promise<void> {
    const infoDocumento = this.getDocumentoInfo(viajero);
    await this.copiarAlPortapapeles(infoDocumento, 'Documento');
  }

  /**
   * Verifica si un documento está vencido
   */
  isDocumentoVencido(fechaVencimiento: string | null): boolean {
    if (!fechaVencimiento) return false;
    return new Date(fechaVencimiento) < new Date();
  }

  /**
   * Verifica si un documento está próximo a vencer (30 días)
   */
  isDocumentoProximoVencer(fechaVencimiento: string | null): boolean {
    if (!fechaVencimiento) return false;
    const vencimiento = new Date(fechaVencimiento).getTime();
    const hoy = new Date().getTime();
    const treintaDias = 30 * 24 * 60 * 60 * 1000;
    return (vencimiento - hoy) < treintaDias && vencimiento > hoy;
  }

  /**
   * Obtiene la clase CSS para el estado del documento
   */
  getDocumentoStatusClass(fechaVencimiento: string | null): string {
    if (this.isDocumentoVencido(fechaVencimiento)) {
      return 'bg-red-100 text-red-800';
    } else if (this.isDocumentoProximoVencer(fechaVencimiento)) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-green-100 text-green-800';
    }
  }

  /**
   * Obtiene el texto del estado del documento
   */
  getDocumentoStatusText(fechaVencimiento: string | null): string {
    if (this.isDocumentoVencido(fechaVencimiento)) {
      return 'Vencido';
    } else if (this.isDocumentoProximoVencer(fechaVencimiento)) {
      return 'Por vencer';
    } else {
      return 'Vigente';
    }
  }

  /**
   * Maneja el cambio de selección de documento en el dropdown
   */
  onDocumentoSelectionChange(event: Event, viajero: ExportedViajero): void {
    const target = event.target as HTMLSelectElement;
    const index = parseInt(target.value);
    if (index >= 0 && index < viajero.documentos.length) {
      this.seleccionarDocumento(viajero, viajero.documentos[index]);
    }
  }

  /**
   * Cierra el modal de exportación
   */
  cerrarModalExportar(): void {
    this.mostrarModalExportar = false;
    this.viajerosProcesados = [];
  }

  /**
   * Obtiene el ícono para cada clasificación de edad
   */
  getClasificacionIcon(clasificacion: string): string {
    switch (clasificacion) {
      case 'Adulto': return 'fas fa-user';
      case 'Niño': return 'fas fa-child';
      case 'Infante': return 'fas fa-baby';
      default: return 'fas fa-user';
    }
  }

  /**
   * Obtiene la clase CSS para cada clasificación de edad
   */
  getClasificacionClass(clasificacion: string): string {
    switch (clasificacion) {
      case 'Adulto': return 'bg-blue-100 text-blue-800';
      case 'Niño': return 'bg-green-100 text-green-800';
      case 'Infante': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Obtiene el conteo de viajeros por clasificación
   */
  getCountByClassification(clasificacion: 'Adulto' | 'Niño' | 'Infante'): number {
    return this.viajerosProcesados.filter(v => v.clasificacionEdad === clasificacion).length;
  }

  /**
   * Descarga los datos procesados como archivo JSON
   */
  descargarJSON(): void {
    const dataStr = JSON.stringify(this.viajerosProcesados, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `viajeros_exportados_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    // Limpiar el objeto URL
    URL.revokeObjectURL(link.href);
  }

  /**
   * Copia texto al portapapeles y muestra confirmación visual
   */
  async copiarAlPortapapeles(texto: string, campo: string): Promise<void> {
    try {
      this.copiandoTexto = true;
      this.ultimoTextoCopiado = campo;

      await navigator.clipboard.writeText(texto);
      console.log(`${campo} copiado al portapapeles: ${texto}`);

      // Mostrar feedback visual por 2 segundos
      setTimeout(() => {
        this.copiandoTexto = false;
        this.ultimoTextoCopiado = '';
      }, 2000);

    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
      // Fallback para navegadores que no soportan clipboard API
      this.copiarConFallback(texto);
      this.copiandoTexto = false;
    }
  }

  /**
   * Método fallback para copiar texto en navegadores antiguos
   */
  private copiarConFallback(texto: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = texto;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      console.log('Texto copiado usando fallback');
    } catch (err) {
      console.error('Error en fallback de copia:', err);
    }

    document.body.removeChild(textArea);
  }

  /**
   * Copia todos los datos de un viajero en formato estructurado
   */
  async copiarTodosLosDatos(viajero: ExportedViajero): Promise<void> {
    const documentoInfo = viajero.documentoSeleccionado
      ? `\n\n📄 DOCUMENTO SELECCIONADO\nTipo: ${viajero.documentoSeleccionado.documento.tipo}\nNúmero: ${viajero.documentoSeleccionado.numero}\nFecha Emisión: ${viajero.documentoSeleccionado.fechaEmision ? new Date(viajero.documentoSeleccionado.fechaEmision).toLocaleDateString() : 'No especificada'}\nFecha Vencimiento: ${viajero.documentoSeleccionado.fechaVencimiento ? new Date(viajero.documentoSeleccionado.fechaVencimiento).toLocaleDateString() : 'No especificada'}\nOrigen: ${viajero.documentoSeleccionado.origen || 'No especificado'}`
      : '\n\n📄 DOCUMENTO\nSin documento asignado';

    const datosCompletos = `DATOS DEL VIAJERO
═══════════════════

👤 INFORMACIÓN PERSONAL
Nombres: ${viajero.nombres}
Apellidos: ${viajero.apellidos}
Nombre Completo: ${viajero.nombreCompleto}
Clasificación: ${viajero.clasificacionEdad}
Fecha de Nacimiento: ${viajero.fechaNacimiento}${documentoInfo}

📞 CONTACTO
Teléfono: ${viajero.telefono || 'No disponible'}
Email: ${viajero.email}

🆔 DETALLES ADICIONALES
ID: #${viajero.id}
Nacionalidad: ${viajero.viajeroOriginal.nacionalidad}
Residencia: ${viajero.viajeroOriginal.residencia}

────────────────────
Exportado el: ${new Date().toLocaleString()}`;

    await this.copiarAlPortapapeles(datosCompletos, 'Datos Completos del Viajero');
  }

  /**
   * Copia solo los nombres del viajero
   */
  async copiarSoloNombres(viajero: ExportedViajero): Promise<void> {
    await this.copiarAlPortapapeles(viajero.nombres, 'Solo Nombres');
  }

  /**
   * Copia solo los apellidos del viajero
   */
  async copiarSoloApellidos(viajero: ExportedViajero): Promise<void> {
    await this.copiarAlPortapapeles(viajero.apellidos, 'Solo Apellidos');
  }

  // ===== MÉTODOS FALTANTES PARA EL TEMPLATE =====

  /**
   * Obtiene las iniciales del viajero usando solo datos disponibles
   */
  getViajeroInitials(viajero: ViajeroResponse): string {
    // ViajeroResponse solo tiene: id, fechaNacimiento, nacionalidad, residencia, creado, actualizado
    if (viajero.nacionalidad) {
      return viajero.nacionalidad.substring(0, 2).toUpperCase();
    }
    return `V${viajero.id}`;
  }

  /**
   * Ordena la lista por campo especificado
   */
  sortBy(campo: string): void {
    // TODO: Implementar ordenamiento según el campo
    console.log(`Ordenando por: ${campo}`);
  }

}
