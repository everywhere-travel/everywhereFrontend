import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DocumentoService } from '../../core/service/Documento/documento.service';
import { DocumentoRequest, DocumentoResponse } from '../../shared/models/Documento/documento.model';
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';
import { ErrorModalComponent, ErrorModalData, BackendErrorResponse } from '../../shared/components/error-modal/error-modal.component';
import { ErrorHandlerService } from '../../shared/services/error-handler.service';

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
    ErrorModalComponent
  ]
})
export class DocumentosComponent implements OnInit {

  // Sidebar Configuration
  sidebarCollapsed = false;
  sidebarMenuItems: SidebarMenuItem[] = [
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
      children: [
        {
          id: 'personas',
          title: 'Clientes',
          icon: 'fas fa-address-card',
          route: '/personas'
        },
        {
          id: 'viajeros',
          title: 'Viajeros',
          icon: 'fas fa-passport',
          route: '/viajero'
        },
        {
          id: 'viajeros-frecuentes',
          title: 'Viajeros Frecuentes',
          icon: 'fas fa-crown',
          route: '/viajero-frecuente'
        }
      ]
    },
    {
      id: 'cotizaciones',
      title: 'Cotizaciones',
      icon: 'fas fa-file-invoice',
      route: '/cotizaciones'
    },
    {
      id: 'liquidaciones',
      title: 'Liquidaciones',
      icon: 'fas fa-credit-card',
      route: '/liquidaciones'
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
          route: '/productos'
        },
        {
          id: 'proveedores',
          title: 'Proveedores',
          icon: 'fas fa-truck',
          route: '/proveedores'
        },
        {
          id: 'operadores',
          title: 'Operadores',
          icon: 'fas fa-headset',
          route: '/operadores'
        },
        {
          id: 'documentos',
          title: 'Documentos',
          icon: 'fas fa-file-alt',
          route: '/documentos'
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
          route: '/counters'
        },
        {
          id: 'sucursales',
          title: 'Sucursales',
          icon: 'fas fa-building',
          route: '/sucursales'
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
          route: '/carpetas'
        }
      ]
    },
    {
      id: 'reportes',
      title: 'Reportes y Analytics',
      icon: 'fas fa-chart-bar',
      children: [
        {
          id: 'estadisticas',
          title: 'Estadísticas',
          icon: 'fas fa-chart-line',
          route: '/estadistica'
        },
        {
          id: 'reportes-general',
          title: 'Reportes Generales',
          icon: 'fas fa-file-pdf',
          route: '/reportes'
        }
      ]
    },
    {
      id: 'configuracion',
      title: 'Configuración',
      icon: 'fas fa-cog',
      children: [
        {
          id: 'usuarios',
          title: 'Usuarios',
          icon: 'fas fa-user-shield',
          route: '/usuarios'
        },
        {
          id: 'sistema',
          title: 'Sistema',
          icon: 'fas fa-server',
          route: '/configuracion'
        }
      ]
    }
  ];


  // Estado general
  loading = false;
  documentos: DocumentoTabla[] = [];
  filteredDocumentos: DocumentoTabla[] = [];
  totalDocumentos = 0;

  // Búsqueda y filtros
  searchTerm = '';
  selectedTipo = '';

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;

  // Vistas
  currentView: 'table' | 'cards' | 'list' = 'table';

  // Selección múltiple
  selectedItems: number[] = [];
  allSelected = false;
  someSelected = false;

  // Ordenamiento
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Modales
  mostrarModalCrear = false;
  mostrarModalEliminar = false;
  mostrarModalError = false;

  // Formularios
  documentoForm!: FormGroup;
  editandoDocumento = false;
  documentoAEliminar: DocumentoTabla | null = null;

  // Error handling
  errorModalData: ErrorModalData = {
    title: '',
    message: ''
  };
  backendErrorData: BackendErrorResponse | null = null;

  // Tipo mappings
  tipoOptions = [
    { value: 'PASAPORTE', label: 'Pasaporte' },
    { value: 'DNI', label: 'DNI' },
    { value: 'CEDULA', label: 'Cédula' },
    { value: 'VISA', label: 'Visa' },
    { value: 'LICENCIA', label: 'Licencia' },
    { value: 'OTRO', label: 'Otro' }
  ];

  constructor(
    private documentoService: DocumentoService,
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
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

  onSidebarItemClick(item: SidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  // Data loading
  cargarDocumentos(): void {
    this.loading = true;
    this.documentoService.getAllDocumentos().subscribe({
      next: (documentos) => {
        this.documentos = documentos.map(doc => ({
          id: doc.id,
          tipo: doc.tipo,
          descripcion: doc.descripcion || '',
          estado: doc.estado,
          creado: this.formatDateToString(doc.creado),
          actualizado: this.formatDateToString(doc.actualizado)
        }));
        this.aplicarFiltros();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar documentos:', error);
        this.mostrarError('Error al cargar documentos', 'No se pudieron cargar los tipos de documentos.');
        this.loading = false;
      }
    });
  }

  refreshData(): void {
    this.cargarDocumentos();
  }

  // Search and filters
  onSearchChange(): void {
    this.currentPage = 1;
    this.aplicarFiltros();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let filtered = [...this.documentos];

    // Filtro por búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.tipo.toLowerCase().includes(term) ||
        doc.descripcion.toLowerCase().includes(term)
      );
    }

    // Filtro por tipo
    if (this.selectedTipo) {
      filtered = filtered.filter(doc => doc.tipo === this.selectedTipo);
    }

    this.filteredDocumentos = filtered;
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.totalDocumentos = this.documentos.length;

    // Adjust current page if necessary
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  // View controls
  changeView(view: 'table' | 'cards' | 'list'): void {
    this.currentView = view;
  }

  // Pagination
  get paginatedDocumentos(): DocumentoTabla[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredDocumentos.slice(start, end);
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.aplicarFiltros();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Selection methods
  isSelected(id: number): boolean {
    return this.selectedItems.includes(id);
  }

  toggleSelection(id: number): void {
    const index = this.selectedItems.indexOf(id);
    if (index === -1) {
      this.selectedItems.push(id);
    } else {
      this.selectedItems.splice(index, 1);
    }
    this.updateSelectionState();
  }

  toggleAllSelection(): void {
    if (this.allSelected) {
      this.selectedItems = [];
    } else {
      this.selectedItems = this.paginatedDocumentos.map(doc => doc.id);
    }
    this.updateSelectionState();
  }

  private updateSelectionState(): void {
    const pageIds = this.paginatedDocumentos.map(doc => doc.id);
    const selectedInPage = this.selectedItems.filter(id => pageIds.includes(id));

    this.allSelected = pageIds.length > 0 && selectedInPage.length === pageIds.length;
    this.someSelected = selectedInPage.length > 0 && selectedInPage.length < pageIds.length;
  }

  clearSelection(): void {
    this.selectedItems = [];
    this.updateSelectionState();
  }

  // Sorting
  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredDocumentos.sort((a, b) => {
      let aValue = (a as any)[column];
      let bValue = (b as any)[column];

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // CRUD Operations
  abrirModalCrear(): void {
    this.editandoDocumento = false;
    this.documentoForm.reset();
    this.mostrarModalCrear = true;
  }

  editarDocumento(documento: DocumentoTabla): void {
    this.editandoDocumento = true;
    this.documentoForm.patchValue({
      tipo: documento.tipo,
      descripcion: documento.descripcion
    });
    this.mostrarModalCrear = true;
  }

  guardarDocumento(): void {
    if (this.documentoForm.valid) {
      this.loading = true;
      const documentoData = this.documentoForm.value;

      const operation = this.editandoDocumento
        ? this.documentoService.updateDocumento((this.documentoForm as any).documentoId, documentoData)
        : this.documentoService.createDocumento(documentoData);

      operation.subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarDocumentos();
          this.loading = false;
        },
        error: (error) => {
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

  editarSeleccionados(): void {
    // Implementation for bulk edit
    console.log('Editar seleccionados:', this.selectedItems);
  }

  eliminarSeleccionados(): void {
    if (this.selectedItems.length > 0 && confirm(`¿Eliminar ${this.selectedItems.length} documentos seleccionados?`)) {
      // Implementation for bulk delete
      console.log('Eliminar seleccionados:', this.selectedItems);
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

  getTipoColorClass(tipo: string): string {
    const colorMap: { [key: string]: string } = {
      'PASAPORTE': 'bg-blue-100 text-blue-800',
      'DNI': 'bg-green-100 text-green-800',
      'CEDULA': 'bg-yellow-100 text-yellow-800',
      'VISA': 'bg-purple-100 text-purple-800',
      'LICENCIA': 'bg-red-100 text-red-800',
      'OTRO': 'bg-gray-100 text-gray-800'
    };
    return colorMap[tipo] || 'bg-gray-100 text-gray-800';
  }

  getUniqueTypesCount(): number {
    const uniqueTypes = new Set(this.documentos.map(doc => doc.tipo));
    return uniqueTypes.size;
  }

  // Math utility
  get Math() {
    return Math;
  }

  // Error handling
  private mostrarError(title: string, message: string, backendError?: any): void {
    this.errorModalData = { title, message };
    this.mostrarModalError = true;
  }
}
