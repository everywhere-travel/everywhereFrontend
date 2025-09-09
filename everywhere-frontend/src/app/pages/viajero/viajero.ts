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
      icon: 'fas fa-suitcase-rolling',
      route: '/productos'
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

  // 🔥🔥🔥 DEBUG: Método de depuración para cargar viajeros
  private debugLoadViajeros(context: string): void {
    console.log(`🔥🔥🔥 VIAJEROS DEBUG [${context}]: Iniciando carga de viajeros`);
    console.log(`🔥🔥🔥 VIAJEROS DEBUG [${context}]: isLoading = ${this.isLoading}`);
  }

  // Load data
  loadViajeros(): void {
    this.debugLoadViajeros('LOAD_VIAJEROS');
    this.isLoading = true;
    
    this.viajeroService.findAll().subscribe({
      next: (data) => {
        console.log('🔥🔥🔥 VIAJEROS DEBUG: Datos recibidos:', data);
        this.viajeros = data;
        this.aplicarFiltros();
        this.calcularEstadisticas();
        this.isLoading = false;
        console.log(`🔥🔥🔥 VIAJEROS DEBUG: Carga completada. Total viajeros: ${this.viajeros.length}`);
      },
      error: (error) => {
        console.error('🔥🔥🔥 VIAJEROS ERROR: Error al cargar viajeros:', error);
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
    console.log('🔥🔥🔥 VIAJEROS SEARCH: Búsqueda actualizada:', this.searchQuery);
    this.aplicarFiltros();
  }

  aplicarFiltroTipo(tipo: string): void {
    console.log('🔥🔥🔥 VIAJEROS FILTER: Aplicando filtro tipo:', tipo);
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
    console.log(`🔥🔥🔥 VIAJEROS FILTER: Filtrados: ${this.viajerosFiltrados.length} de ${this.viajeros.length}`);
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
    console.log('🔥🔥🔥 VIAJEROS VIEW: Cambiando vista a:', view);
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
    console.log('🔥🔥🔥 VIAJEROS SELECTION: Items seleccionados:', this.selectedItems);
  }

  toggleAllSelection(): void {
    if (this.allSelected) {
      this.selectedItems = [];
    } else {
      this.selectedItems = this.viajerosFiltrados.map(v => v.id);
    }
    console.log('🔥🔥🔥 VIAJEROS SELECTION: Selección masiva, total:', this.selectedItems.length);
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
    console.log('🔥🔥🔥 VIAJEROS TABLE ACTION: Toggle menú para viajero:', viajeroId);
    console.log('🔥🔥🔥 VIAJEROS TABLE ACTION: Estado anterior showActionMenu:', this.showActionMenu);
    this.showActionMenuCards = null;
    this.showActionMenuList = null;
    this.showActionMenu = this.showActionMenu === viajeroId ? null : viajeroId;
    console.log('🔥🔥🔥 VIAJEROS TABLE ACTION: Estado nuevo showActionMenu:', this.showActionMenu);
  }

  toggleActionMenuCards(viajeroId: number): void {
    console.log('🔥🔥🔥 VIAJEROS CARDS ACTION: Toggle menú para viajero:', viajeroId);
    console.log('🔥🔥🔥 VIAJEROS CARDS ACTION: Estado anterior showActionMenuCards:', this.showActionMenuCards);
    this.showActionMenu = null;
    this.showActionMenuList = null;
    this.showActionMenuCards = this.showActionMenuCards === viajeroId ? null : viajeroId;
    console.log('🔥🔥🔥 VIAJEROS CARDS ACTION: Estado nuevo showActionMenuCards:', this.showActionMenuCards);
  }

  toggleActionMenuList(viajeroId: number): void {
    console.log('🔥🔥🔥 VIAJEROS LIST ACTION: Toggle menú para viajero:', viajeroId);
    console.log('🔥🔥🔥 VIAJEROS LIST ACTION: Estado anterior showActionMenuList:', this.showActionMenuList);
    this.showActionMenu = null;
    this.showActionMenuCards = null;
    this.showActionMenuList = this.showActionMenuList === viajeroId ? null : viajeroId;
    console.log('🔥🔥🔥 VIAJEROS LIST ACTION: Estado nuevo showActionMenuList:', this.showActionMenuList);
  }

  closeAllMenus(): void {
    console.log('🔥🔥🔥 VIAJEROS CLOSE: Cerrando todos los menús');
    console.log('🔥🔥🔥 VIAJEROS CLOSE: Estados antes - Table:', this.showActionMenu, 'Cards:', this.showActionMenuCards, 'List:', this.showActionMenuList);
    this.showActionMenu = null;
    this.showActionMenuCards = null;
    this.showActionMenuList = null;
    console.log('🔥🔥🔥 VIAJEROS CLOSE: Todos los menús cerrados');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    console.log('🔥🔥🔥 VIAJEROS CLICK: Document click detectado');
    console.log('🔥🔥🔥 VIAJEROS CLICK: Target element:', target);
    console.log('🔥🔥🔥 VIAJEROS CLICK: Closest action-menu-container:', target.closest('.action-menu-container'));
    console.log('🔥🔥🔥 VIAJEROS CLICK: Closest data-action-menu:', target.closest('[data-action-menu]'));
    
    if (!target.closest('.action-menu-container') && !target.closest('[data-action-menu]')) {
      console.log('🔥🔥🔥 VIAJEROS CLICK: Click fuera de menús, cerrando todos');
      this.closeAllMenus();
    } else {
      console.log('🔥🔥🔥 VIAJEROS CLICK: Click dentro de menú, manteniendo abierto');
    }
  }

  // CRUD operations
  verViajero(viajero: ViajeroResponse): void {
    console.log('🔥🔥🔥 VIAJEROS ACTION: Ver detalles del viajero:', viajero.id);
    this.viajeroDetalles = viajero;
    this.mostrarModalDetalles = true;
    this.closeAllMenus();
  }

  editarViajero(viajero: ViajeroResponse): void {
    console.log('🔥🔥🔥 VIAJEROS ACTION: Editar viajero:', viajero.id);
    this.editandoViajero = viajero;
    this.populateFormWithViajero(viajero);
    this.mostrarModalCrearViajero = true;
    this.closeAllMenus();
  }

  confirmarEliminar(viajero: ViajeroResponse): void {
    console.log('🔥🔥🔥 VIAJEROS ACTION: Confirmar eliminación del viajero:', viajero.id);
    this.viajeroAEliminar = viajero;
    this.mostrarModalEliminar = true;
    this.closeAllMenus();
  }

  confirmarEliminacionModal(): void {
    if (this.viajeroAEliminar) {
      console.log('🔥🔥🔥 VIAJEROS DELETE: Eliminando viajero:', this.viajeroAEliminar.id);
      this.viajeroService.deleteById(this.viajeroAEliminar.id).subscribe({
        next: () => {
          console.log('🔥🔥🔥 VIAJEROS DELETE: Viajero eliminado exitosamente');
          this.cerrarModalEliminar();
          this.loadViajeros();
        },
        error: (error) => {
          console.error('🔥🔥🔥 VIAJEROS DELETE ERROR:', error);
          this.cerrarModalEliminar();
        }
      });
    }
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.viajeroAEliminar = null;
  }

  abrirModalCrearViajero(): void {
    console.log('🔥🔥🔥 VIAJEROS ACTION: Abrir modal crear viajero');
    this.editandoViajero = null;
    this.viajeroForm.reset();
    this.mostrarModalCrearViajero = true;
  }

  // Bulk operations
  editarSeleccionados(): void {
    console.log('🔥🔥🔥 VIAJEROS BULK: Editar seleccionados:', this.selectedItems);
    // TODO: Implementar edición masiva
  }

  eliminarSeleccionados(): void {
    console.log('🔥🔥🔥 VIAJEROS BULK: Eliminar seleccionados:', this.selectedItems);
    // TODO: Implementar eliminación masiva
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

    console.log(`🔥🔥🔥 VIAJEROS SORT: Ordenado por ${column} ${this.sortDirection}`);
  }

  // Track by functions
  trackByViajeroId(index: number, viajero: ViajeroResponse): number {
    return viajero.id;
  }

  // Sidebar methods
  onSidebarItemClick(item: SidebarMenuItem): void {
    console.log('🔥🔥🔥 SIDEBAR: Item clicked:', item);
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    console.log('🔥🔥🔥 SIDEBAR: Collapsed:', this.sidebarCollapsed);
  }

  // Form methods
  private createViajeroForm(): FormGroup {
    return this.formBuilder.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidoPaterno: ['', [Validators.required, Validators.minLength(2)]],
      apellidoMaterno: ['', [Validators.required, Validators.minLength(2)]],
      fechaNacimiento: ['', Validators.required],
      nacionalidad: ['', Validators.required],
      residencia: ['', Validators.required],
      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.minLength(5)]],
      fechaEmisionDocumento: ['', Validators.required],
      fechaVencimientoDocumento: ['', Validators.required],
      persona: this.formBuilder.group({
        email: ['', [Validators.email]],
        telefono: [''],
        direccion: ['']
      })
    });
  }

  // Refresh data
  refreshData(): void {
    console.log('🔥🔥🔥 VIAJEROS: Refrescando datos');
    this.loadViajeros();
  }

  // Método para poblar el formulario con datos del viajero
  populateFormWithViajero(viajero: ViajeroResponse): void {
    console.log('🔥🔥🔥 VIAJEROS: Poblando formulario con datos del viajero:', viajero);
    
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
    
    console.log('🔥🔥🔥 VIAJEROS: Formulario poblado, valores actuales:', this.viajeroForm.value);
  }

  // Método para cerrar modal de detalles
  cerrarModalDetalles(): void {
    console.log('🔥🔥🔥 VIAJEROS: Cerrando modal de detalles');
    this.mostrarModalDetalles = false;
    this.viajeroDetalles = null;
  }

  // Método para cerrar modal de crear/editar
  cerrarModalCrearViajero(): void {
    console.log('🔥🔥🔥 VIAJEROS: Cerrando modal de crear/editar viajero');
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
    console.log('🔥🔥🔥 VIAJEROS: Enviando formulario...');
    
    if (this.viajeroForm.invalid) {
      console.log('🔥🔥🔥 VIAJEROS: Formulario inválido, marcando campos como touched');
      Object.keys(this.viajeroForm.controls).forEach(key => {
        this.viajeroForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    const formData = this.viajeroForm.value;
    console.log('🔥🔥🔥 VIAJEROS: Datos del formulario:', formData);

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
      console.log('🔥🔥🔥 VIAJEROS: Actualizando viajero con ID:', this.editandoViajero.id);
      
      this.viajeroService.update(this.editandoViajero.id, viajeroRequest).subscribe({
        next: (response) => {
          console.log('🔥🔥🔥 VIAJEROS: Viajero actualizado exitosamente:', response);
          this.isSubmitting = false;
          this.cerrarModalCrearViajero();
          this.loadViajeros();
          // Aquí podrías agregar una notificación de éxito
        },
        error: (error) => {
          console.error('🔥🔥🔥 VIAJEROS: Error al actualizar viajero:', error);
          this.isSubmitting = false;
          // Aquí podrías agregar una notificación de error
        }
      });
    } else {
      // Crear nuevo viajero
      console.log('🔥🔥🔥 VIAJEROS: Creando nuevo viajero');
      
      this.viajeroService.save(viajeroRequest).subscribe({
        next: (response) => {
          console.log('🔥🔥🔥 VIAJEROS: Viajero creado exitosamente:', response);
          this.isSubmitting = false;
          this.cerrarModalCrearViajero();
          this.loadViajeros();
          // Aquí podrías agregar una notificación de éxito
        },
        error: (error) => {
          console.error('🔥🔥🔥 VIAJEROS: Error al crear viajero:', error);
          this.isSubmitting = false;
          // Aquí podrías agregar una notificación de error
        }
      });
    }
  }
}
