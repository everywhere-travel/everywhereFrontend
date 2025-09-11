import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ViajeroService } from '../../core/service/viajero/viajero.service';
import { ViajeroRequest, ViajeroResponse } from '../../shared/models/Viajero/viajero.model';
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-viajero',
  standalone: true,
  templateUrl: './viajero.html',
  styleUrl: './viajero.css',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SidebarComponent
  ]
})
export class Viajero implements OnInit {

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
      active: true,
      children: [
        {
          id: 'personas',
          title: 'Personas',
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
      route: '/cotizaciones',
      badge: '12',
      badgeColor: 'blue'
    },
    {
      id: 'liquidaciones',
      title: 'Liquidaciones',
      icon: 'fas fa-credit-card',
      route: '/liquidaciones'
    },
    {
      id: 'productos',
      title: 'Productos y Servicios',
      icon: 'fas fa-box', 
      children: [
        {
          id: 'productos',
          title: 'Productos',
          icon: 'fas fa-cube',
          route: '/productos'
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
        }
      ]
    }
  ];

  // Data arrays
  viajeros: ViajeroResponse[] = [];
  viajerosFiltrados: ViajeroResponse[] = [];

  // Loading state
  isLoading = true;

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
  mostrarModalCrearViajero = false;
  editandoViajero: ViajeroResponse | null = null;
  isSubmitting = false;

  // Form
  viajeroForm: FormGroup;

  constructor(
    private viajeroService: ViajeroService,
    private router: Router,
    private formBuilder: FormBuilder
  ) {
    this.viajeroForm = this.createViajeroForm();
  }

  ngOnInit(): void {
    this.loadViajeros();
  } 
  // Load data
  loadViajeros(): void { 
    this.isLoading = true;
    
    this.viajeroService.findAll().subscribe({
      next: (data) => { 
        this.viajeros = data;
        this.aplicarFiltros();
        this.calcularEstadisticas();
        this.isLoading = false; 
      },
      error: (error) => { 
        this.isLoading = false;
      }
    });
  }

  // Statistics calculation
  calcularEstadisticas(): void {
    const nacionalidades = new Set(this.viajeros.map(v => v.nacionalidad));
    this.estadisticas.totalNacionalidades = nacionalidades.size;
    
    // Calcular documentos próximos a vencer (próximos 30 días)
    const hoy = new Date();
    const treintaDias = new Date();
    treintaDias.setDate(hoy.getDate() + 30);
    
    this.estadisticas.documentosVenciendo = this.viajeros.filter(viajero => {
      const fechaVencimiento = new Date(viajero.fechaVencimientoDocumento);
      return fechaVencimiento >= hoy && fechaVencimiento <= treintaDias;
    }).length;
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
        viajero.nombres.toLowerCase().includes(query) ||
        viajero.apellidoPaterno.toLowerCase().includes(query) ||
        viajero.apellidoMaterno.toLowerCase().includes(query) ||
        viajero.numeroDocumento.toLowerCase().includes(query) ||
        viajero.nacionalidad.toLowerCase().includes(query) ||
        viajero.residencia.toLowerCase().includes(query)
      );
    }

    // Aplicar filtro por tipo
    if (this.filtroTipo === 'vencimiento-proximo') {
      const hoy = new Date();
      const treintaDias = new Date();
      treintaDias.setDate(hoy.getDate() + 30);
      
      filtrados = filtrados.filter(viajero => {
        const fechaVencimiento = new Date(viajero.fechaVencimientoDocumento);
        return fechaVencimiento >= hoy && fechaVencimiento <= treintaDias;
      });
    }

    this.viajerosFiltrados = filtrados; 
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
    this.mostrarModalDetalles = true;
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

  // Utility methods
  getViajeroInitials(viajero: ViajeroResponse): string {
    const nombres = viajero.nombres?.charAt(0) || '';
    const apellido = viajero.apellidoPaterno?.charAt(0) || '';
    return (nombres + apellido).toUpperCase();
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

  isDocumentoProximoVencer(viajero: ViajeroResponse): boolean {
    if (!viajero.fechaVencimientoDocumento) return false;
    
    const hoy = new Date();
    const vencimiento = new Date(viajero.fechaVencimientoDocumento);
    const diferencia = vencimiento.getTime() - hoy.getTime();
    const dias = Math.ceil(diferencia / (1000 * 3600 * 24));
    
    return dias >= 0 && dias <= 30;
  }

  // Sorting
  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.viajerosFiltrados.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (column) {
        case 'nombres':
          valueA = a.nombres + ' ' + a.apellidoPaterno + ' ' + a.apellidoMaterno;
          valueB = b.nombres + ' ' + b.apellidoPaterno + ' ' + b.apellidoMaterno;
          break;
        case 'numeroDocumento':
          valueA = a.numeroDocumento;
          valueB = b.numeroDocumento;
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      } else if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      } else {
        return 0;
      }
    });
 
  }

  // Track by functions
  trackByViajeroId(index: number, viajero: ViajeroResponse): number {
    return viajero.id;
  }

  // Sidebar methods
  onSidebarItemClick(item: SidebarMenuItem): void { 
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed; 
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
      tipoDocumento: [''],
      numeroDocumento: [''],
      fechaEmisionDocumento: [''],
      fechaVencimientoDocumento: [''],
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
        viajero.nombres || '',
        viajero.apellidoPaterno || '',
        viajero.apellidoMaterno || '',
        viajero.numeroDocumento || '',
        viajero.nacionalidad || '',
        viajero.residencia || '',
        viajero.persona?.email || '',
        viajero.persona?.telefono || ''
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
      nombres: viajero.nombres || '',
      apellidoPaterno: viajero.apellidoPaterno || '',
      apellidoMaterno: viajero.apellidoMaterno || '',
      fechaNacimiento: viajero.fechaNacimiento || '',
      nacionalidad: viajero.nacionalidad || '',
      residencia: viajero.residencia || '',
      tipoDocumento: viajero.tipoDocumento || '',
      numeroDocumento: viajero.numeroDocumento || '',
      fechaEmisionDocumento: viajero.fechaEmisionDocumento || '',
      fechaVencimientoDocumento: viajero.fechaVencimientoDocumento || '',
      persona: {
        email: viajero.persona?.email || '',
        telefono: viajero.persona?.telefono || '',
        direccion: viajero.persona?.direccion || ''
      }
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
      nombres: formData.nombres,
      apellidoPaterno: formData.apellidoPaterno,
      apellidoMaterno: formData.apellidoMaterno,
      fechaNacimiento: formData.fechaNacimiento,
      nacionalidad: formData.nacionalidad,
      residencia: formData.residencia,
      tipoDocumento: formData.tipoDocumento,
      numeroDocumento: formData.numeroDocumento,
      fechaEmisionDocumento: formData.fechaEmisionDocumento,
      fechaVencimientoDocumento: formData.fechaVencimientoDocumento,
      persona: {
        email: formData.persona.email,
        telefono: formData.persona.telefono,
        direccion: formData.persona.direccion
      }
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
}
