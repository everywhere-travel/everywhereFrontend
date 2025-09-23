import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PersonaNaturalService } from '../../core/service/natural/persona-natural.service';
import { PersonaJuridicaService } from '../../core/service/juridica/persona-juridica.service';
import { ViajeroService } from '../../core/service/viajero/viajero.service';
import { PersonaNaturalRequest, PersonaNaturalResponse } from '../../shared/models/Persona/personaNatural.model';
import { PersonaJuridicaRequest, PersonaJuridicaResponse } from '../../shared/models/Persona/personaJuridica.models';
import { ViajeroRequest, ViajeroResponse } from '../../shared/models/Viajero/viajero.model';
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';

// Interface simplificada para la tabla - NO incluye personas base
export interface PersonaTabla {
  id: number;
  tipo: 'natural' | 'juridica';
  nombre: string;
  nombres?: string;  // Para compatibilidad con el HTML
  apellidos?: string; // Para compatibilidad con el HTML
  razonSocial?: string; // Para compatibilidad con el HTML
  documento: string;
  ruc?: string; // Para compatibilidad con el HTML
  email?: string;
  telefono?: string;
  direccion?: string;
}

@Component({
  selector: 'app-personas',
  standalone: true,
  templateUrl: './personas.component.html',
  styleUrls: ['./personas.component.css'],
  imports: [
    CommonModule,
    FormsModule, 
    ReactiveFormsModule,
    SidebarComponent
  ]
})
export class PersonasComponent implements OnInit {

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

  // Formularios
  personaNaturalForm!: FormGroup;
  personaJuridicaForm!: FormGroup;
  viajeroForm!: FormGroup;
  viajeroFrecuenteForm!: FormGroup;

  // Variables para campos dinámicos
  showOtraNacionalidad: boolean = false;
  showOtraResidencia: boolean = false;

  // Variables de control para la tabla
  searchTerm: string = '';
  searchQuery: string = '';
  selectedType: 'todos' | 'natural' | 'juridica' = 'todos';
  filtroTipo: 'todos' | 'natural' | 'juridica' = 'todos';
  filterType: 'all' | 'natural' | 'juridica' = 'all';
  loading: boolean = false;
  isLoading: boolean = false;
  isSubmitting: boolean = false;

  // Variables de control para las vistas
  currentView: 'table' | 'cards' | 'list' = 'table';

  // Variables para modales
  showPersonaNaturalModal: boolean = false;
  showPersonaJuridicaModal: boolean = false;
  mostrarModalNatural: boolean = false;
  mostrarModalJuridica: boolean = false;
  mostrarModalCrearCliente: boolean = false;
  mostrarModalDetalles: boolean = false;
  isEditMode: boolean = false;
  editandoPersona: boolean = false;
  editingId: number | null = null;
  currentPersonaId: number | null = null;
  personaDetalles: PersonaTabla | null = null;

  // Variables para menú de acciones - separados por vista
  showActionMenu: number | null = null; // Para vista de tabla
  showActionMenuCards: number | null = null; // Para vista de tarjetas
  showActionMenuList: number | null = null; // Para vista de lista
  showQuickActions: number | null = null; // Para quick actions en cards/list

  // Variables para modal de confirmación de eliminación
  mostrarModalEliminar: boolean = false;
  personaAEliminar: PersonaTabla | null = null;

  // Variables para tabs
  activeTab: 'natural' | 'juridica' | 'viajero' = 'natural';

  // Variables para ordenamiento y UX
  sortDirection: 'asc' | 'desc' = 'asc';
  sortColumn: string = 'nombre';

  // Variables para selección múltiple
  selectedItems: number[] = [];
  allSelected: boolean = false;
  someSelected: boolean = false;

  // Variables para paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Math object for template use
  Math = Math;

  // Variables adicionales para otras funcionalidades
  selectedViajeroId: number | null = null;
  viajeros: any[] = [];
  nacionalidades: string[] = ['Peruana', 'Extranjera'];
  tiposDocumento = [
    { value: 'DNI', label: 'DNI' },
    { value: 'PASAPORTE', label: 'Pasaporte' },
    { value: 'CARNET_EXTRANJERIA', label: 'Carnet de Extranjería' }
  ];

  // Variables de sidebar
  sidebarOpen: boolean = false;
  activeSection: string = 'clientes';

  // Estadísticas
  estadisticas = {
    totalNaturales: 0,
    totalJuridicas: 0,
    totalViajeros: 0
  };

  // Datos - solo naturales y jurídicas
  personas: PersonaTabla[] = [];
  filteredPersonas: PersonaTabla[] = [];
  personasFiltradas: PersonaTabla[] = [];

  constructor(
    private fb: FormBuilder,
    private personaNaturalService: PersonaNaturalService,
    private personaJuridicaService: PersonaJuridicaService,
    private viajeroService: ViajeroService,
    private router: Router
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadPersonas();
    this.calcularEstadisticas();
  }

  // Métodos de compatibilidad con el HTML

  // Métodos de modal principal con tabs
  abrirModalCrearCliente(): void {
    this.editandoPersona = false;
    this.mostrarModalCrearCliente = true;
    this.activeTab = 'natural';
    this.resetAllForms();
  }

  cerrarModalCrearCliente(): void {
    this.mostrarModalCrearCliente = false;
    this.editandoPersona = false;
    this.activeTab = 'natural';
    this.resetAllForms();
    // Limpiar selecciones después de editar
    if (this.isEditMode && this.currentPersonaId) {
      this.selectedItems = this.selectedItems.filter(id => id !== this.currentPersonaId);
      this.updateSelectionState();
    }
    this.isEditMode = false;
    this.currentPersonaId = null;
  }

  setActiveTab(tab: 'natural' | 'juridica' | 'viajero'): void {
    // No permitir cambio de tabs durante edición
    if (this.editandoPersona) {
      return;
    }
    this.activeTab = tab;
  }

  resetAllForms(): void {
    this.personaNaturalForm.reset();
    this.personaJuridicaForm.reset();
    this.viajeroForm.reset();
  }

  onSubmitViajero(): void {
    if (this.viajeroForm.invalid) {
      this.markFormGroupTouched(this.viajeroForm);
      return;
    }

    try {
      this.loading = true;
      this.isSubmitting = true;
      const formData = this.viajeroForm.value;
      
      // Determinar la nacionalidad final
      const nacionalidadFinal = formData.nacionalidad === 'Otra' 
        ? formData.otraNacionalidad 
        : formData.nacionalidad;
      
      // Determinar la residencia final  
      const residenciaFinal = formData.residencia === 'Otro'
        ? formData.otraResidencia
        : formData.residencia;
      
      const request: ViajeroRequest = {
        nombres: formData.nombres,
        apellidoPaterno: formData.apellidoPaterno,
        apellidoMaterno: formData.apellidoMaterno,
        fechaNacimiento: formData.fechaNacimiento,
        nacionalidad: nacionalidadFinal,
        residencia: residenciaFinal,
        tipoDocumento: formData.tipoDocumento,
        numeroDocumento: formData.numeroDocumento,
        fechaEmisionDocumento: formData.fechaEmisionDocumento,
        fechaVencimientoDocumento: formData.fechaVencimientoDocumento,
        persona: formData.persona
      };

      this.viajeroService.save(request).subscribe({
        next: () => {
          this.loadPersonas();
          this.cerrarModalCrearCliente();
          this.isSubmitting = false;
        },
        error: (error: any) => {
          console.error('Error al crear viajero:', error);
          this.loading = false;
          this.isSubmitting = false;
        }
      });
    } catch (error: any) {
      console.error('Error al procesar viajero:', error);
      this.loading = false;
      this.isSubmitting = false;
    }
  }

  // Métodos para campos dinámicos
  onNacionalidadChange(event: any): void {
    const value = event.target.value;
    this.showOtraNacionalidad = value === 'Otra';
    
    if (!this.showOtraNacionalidad) {
      this.viajeroForm.get('otraNacionalidad')?.setValue('');
    }
  }

  onResidenciaChange(event: any): void {
    const value = event.target.value;
    this.showOtraResidencia = value === 'Otro';
    
    if (!this.showOtraResidencia) {
      this.viajeroForm.get('otraResidencia')?.setValue('');
    }
  }

  // Métodos para mejorar UX/UI
  exportarDatos(): void { 
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  isClienteVIP(persona: PersonaTabla): boolean {
    return persona.tipo === 'natural' && (persona as any).categoria === 'VIP';
  }

  getDocumentType(persona: PersonaTabla): string {
    if (persona.tipo === 'natural') {
      return 'DNI/Documento';
    } else {
      return 'RUC';
    }
  }

  confirmarEliminar(persona: PersonaTabla): void { 
    this.closeAllMenus(); // Cerrar todos los menús
    // Mostrar modal de confirmación en lugar de alert feo
    this.personaAEliminar = persona;
    this.mostrarModalEliminar = true;
  }

  // Nuevo método para confirmar eliminación desde el modal
  confirmarEliminacionModal(): void {
    if (this.personaAEliminar) { 
      this.eliminarPersona(this.personaAEliminar.id);
      this.cerrarModalEliminar();
    }
  }

  // Nuevo método para cerrar modal de eliminación
  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.personaAEliminar = null;
  }

  getEmptyStateTitle(): string {
    if (this.searchQuery) {
      return 'No se encontraron resultados';
    }
    if (this.filtroTipo !== 'todos') {
      return `No hay ${this.getPersonaTypeLabel(this.filtroTipo)}s registrados`;
    }
    return 'No hay clientes registrados';
  }

  getEmptyStateMessage(): string {
    if (this.searchQuery) {
      return `No hay resultados para "${this.searchQuery}". Intenta con otros términos de búsqueda.`;
    }
    if (this.filtroTipo !== 'todos') {
      return `Aún no tienes ${this.getPersonaTypeLabel(this.filtroTipo)}s registrados. ¡Crea el primero!`;
    }
    return 'Comienza creando tu primer cliente. Puedes agregar personas naturales o jurídicas.';
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.filtroTipo !== 'todos');
  }

  clearAllFilters(): void {
    this.searchQuery = '';
    this.searchTerm = '';
    this.filtroTipo = 'todos';
    this.selectedType = 'todos';
    this.applyFilters();
  }

  onItemsPerPageChange(): void {
    this.itemsPerPage = Number(this.itemsPerPage);
    this.currentPage = 1;
    this.calcularEstadisticas();
  }

  // Métodos para selección múltiple
  toggleAllSelection(): void {
    if (this.allSelected) {
      this.selectedItems = [];
    } else {
      this.selectedItems = this.personasFiltradas.map(p => p.id);
    }
    this.updateSelectionState();
  }

  toggleSelection(id: number): void {
    const index = this.selectedItems.indexOf(id);
    if (index > -1) {
      this.selectedItems.splice(index, 1);
    } else {
      this.selectedItems.push(id);
    }
    this.updateSelectionState();
  }

  isSelected(id: number): boolean {
    return this.selectedItems.includes(id);
  }

  updateSelectionState(): void {
    const totalItems = this.personasFiltradas.length;
    const selectedCount = this.selectedItems.length;
    
    this.allSelected = selectedCount === totalItems && totalItems > 0;
    this.someSelected = selectedCount > 0 && selectedCount < totalItems;
  }

  // Métodos para acciones masivas
  clearSelection(): void {
    this.selectedItems = [];
    this.updateSelectionState();
  }

  editarSeleccionados(): void {
    if (this.selectedItems.length === 0) return;
    
    if (this.selectedItems.length === 1) {
      // Si solo hay uno seleccionado, abrir editor individual
      const persona = this.personas.find(p => p.id === this.selectedItems[0]);
      if (persona) {
        this.editarPersona(persona);
      }
    } else {
      // Para múltiples elementos, abrir el primer elemento
      const persona = this.personas.find(p => p.id === this.selectedItems[0]);
      if (persona) {
        this.editarPersona(persona); 
      }
    }
  }

  eliminarSeleccionados(): void {
    if (this.selectedItems.length === 0) return;
    
    const confirmMessage = `¿Está seguro de eliminar ${this.selectedItems.length} cliente${this.selectedItems.length > 1 ? 's' : ''}?\n\nEsta acción no se puede deshacer.`;
    if (confirm(confirmMessage)) {
      this.loading = true;
      let eliminados = 0;
      const total = this.selectedItems.length;
      
      this.selectedItems.forEach(id => {
        const persona = this.personas.find(p => p.id === id);
        if (persona) {
          if (persona.tipo === 'natural') {
            this.personaNaturalService.deleteById(id).subscribe({
              next: () => {
                eliminados++;
                if (eliminados === total) {
                  this.loadPersonas();
                  this.clearSelection();
                  this.loading = false;
                }
              },
              error: (error) => {
                console.error('Error al eliminar persona natural:', error);
                eliminados++;
                if (eliminados === total) {
                  this.loadPersonas();
                  this.clearSelection();
                  this.loading = false;
                }
              }
            });
          } else {
            this.personaJuridicaService.deleteById(id).subscribe({
              next: () => {
                eliminados++;
                if (eliminados === total) {
                  this.loadPersonas();
                  this.clearSelection();
                  this.loading = false;
                }
              },
              error: (error) => {
                console.error('Error al eliminar persona jurídica:', error);
                eliminados++;
                if (eliminados === total) {
                  this.loadPersonas();
                  this.clearSelection();
                  this.loading = false;
                }
              }
            });
          }
        }
      });
    }
  }

  // Métodos para el menú de acciones - separados por vista
  toggleActionMenu(id: number): void { 
    // Cerrar otros menús
    this.showQuickActions = null;
    this.showActionMenuCards = null;
    this.showActionMenuList = null;
    
    // Alternar el menú de tabla
    if (this.showActionMenu === id) { 
      this.showActionMenu = null;
    } else { 
      this.showActionMenu = id;
    } 
  }

  toggleActionMenuCards(id: number): void { 
    // Cerrar otros menús
    this.showQuickActions = null;
    this.showActionMenu = null;
    this.showActionMenuList = null;
    
    // Alternar el menú de cards
    if (this.showActionMenuCards === id) { 
      this.showActionMenuCards = null;
    } else { 
      this.showActionMenuCards = id;
    } 
  }

  toggleActionMenuList(id: number): void { 
    // Cerrar otros menús
    this.showQuickActions = null;
    this.showActionMenu = null;
    this.showActionMenuCards = null;
    
    // Alternar el menú de list
    if (this.showActionMenuList === id) { 
      this.showActionMenuList = null;
    } else { 
      this.showActionMenuList = id;
    }
  }

  toggleQuickActions(id: number): void {  
    // Cerrar otros menús
    this.showActionMenu = null;
    this.showActionMenuCards = null;
    this.showActionMenuList = null;
    
    this.showQuickActions = this.showQuickActions === id ? null : id; 
  }

  // Método auxiliar para cerrar todos los menús
  closeAllMenus(): void {
    this.showActionMenu = null;
    this.showActionMenuCards = null;
    this.showActionMenuList = null;
    this.showQuickActions = null;
  }

  // Métodos de utilidad
  getClientInitials(persona: PersonaTabla): string {
    if (persona.tipo === 'natural') {
      const nombres = persona.nombres || '';
      const apellidos = persona.apellidos || '';
      return (nombres.charAt(0) + apellidos.charAt(0)).toUpperCase();
    } else {
      const razon = persona.razonSocial || '';
      return razon.substring(0, 2).toUpperCase();
    }
  }

  refreshData(): void {
    this.loadPersonas();
  }

  // Listener para cerrar menus al hacer click fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // NO CERRAR MENÚS - COMENTADO TEMPORALMENTE
    /*
    const target = event.target as HTMLElement;
    if (!target.closest('.action-menu-container')) {
      this.showActionMenu = null;
      this.showQuickActions = null;
    }
    */
  }

  // Métodos de modal
  abrirModalPersonaNatural(): void {
    this.editandoPersona = false;
    this.activeTab = 'natural';
    this.mostrarModalCrearCliente = true;
    this.personaNaturalForm.reset();
  }

  abrirModalPersonaJuridica(): void {
    this.editandoPersona = false;
    this.activeTab = 'juridica';
    this.mostrarModalCrearCliente = true;
    this.personaJuridicaForm.reset();
  }

  cerrarModalNatural(): void {
    this.cerrarModalCrearCliente();
  }

  cerrarModalJuridica(): void {
    this.cerrarModalCrearCliente();
  }

  onSubmitNatural(): void {
    this.onSubmitPersonaNatural();
  }

  onSubmitJuridica(): void {
    this.onSubmitPersonaJuridica();
  }

  // Métodos de filtros
  aplicarFiltro(tipo: 'todos' | 'natural' | 'juridica'): void {
    this.filtroTipo = tipo;
    this.selectedType = tipo;
    this.currentPage = 1;
    this.applyFilters();
  }

  // Función auxiliar para el template
  aplicarFiltroTipo(tipo: string): void {
    this.aplicarFiltro(tipo as 'todos' | 'natural' | 'juridica');
  }

  // Función auxiliar para cambiar tab
  setActiveTabKey(key: string): void {
    // No permitir cambio de tabs durante edición
    if (this.editandoPersona) {
      return;
    }
    this.setActiveTab(key as 'natural' | 'juridica' | 'viajero');
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  //Pagination
  get paginatedPersonas(): PersonaTabla[] {
    const itemsPerPageNum = Number(this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * itemsPerPageNum;
    const endIndex = startIndex + itemsPerPageNum;
    return this.personasFiltradas.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    const itemsPerPageNum = Number(this.itemsPerPage);
    return Math.ceil(this.totalItems / itemsPerPageNum);
  }

  // Métodos de acciones de tabla
  editarPersona(persona: PersonaTabla): void { 
    this.closeAllMenus(); // Cerrar todos los menús
    this.editandoPersona = true;
    if (persona.tipo === 'natural') {
      this.activeTab = 'natural';
      this.openEditPersonaNaturalModal(persona);
      this.mostrarModalCrearCliente = true;
    } else {
      this.activeTab = 'juridica';
      this.openEditPersonaJuridicaModal(persona);
      this.mostrarModalCrearCliente = true;
    }
  }

  verPersona(persona: PersonaTabla): void { 
    this.closeAllMenus(); // Cerrar todos los menús
    this.personaDetalles = persona;
    this.mostrarModalDetalles = true;
  }

  cerrarModalDetalles(): void {
    this.mostrarModalDetalles = false;
    this.personaDetalles = null;
  }

  eliminarPersona(id: number): void {
    const persona = this.personas.find(p => p.id === id);
    if (persona) {
      this.deletePersona(persona);
    }
  }

  // Métodos de sidebar (compatibilidad)
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  getSectionTitle(): string {
    switch (this.activeSection) {
      case 'clientes': return 'Gestión de Personas';
      case 'viajero-frecuente': return 'Viajeros Frecuentes';
      default: return 'Panel de Control';
    }
  }

  getSectionType(): string {
    return this.filtroTipo === 'natural' ? 'Persona Natural' : 
           this.filtroTipo === 'juridica' ? 'Persona Jurídica' : 'Persona';
  }

  canCreate(): boolean {
    return this.activeSection === 'clientes';
  }

  toggleForm(): void {
    if (this.filtroTipo === 'natural') {
      this.abrirModalPersonaNatural();
    } else if (this.filtroTipo === 'juridica') {
      this.abrirModalPersonaJuridica();
    } else {
      this.abrirModalPersonaNatural(); // Por defecto
    }
  }

  // Calcular estadísticas
  calcularEstadisticas(): void {
    this.estadisticas.totalNaturales = this.personas.filter(p => p.tipo === 'natural').length;
    this.estadisticas.totalJuridicas = this.personas.filter(p => p.tipo === 'juridica').length;
    this.estadisticas.totalViajeros = 0; // No implementado aún
  }

  // Métodos adicionales para compatibilidad con HTML
  searchPersonas(): void {
    this.applyFilters();
  }

  setFilter(type: 'all' | 'natural' | 'juridica'): void {
    this.filterType = type;
    if (type === 'all') {
      this.filtroTipo = 'todos';
      this.selectedType = 'todos';
    } else {
      this.filtroTipo = type;
      this.selectedType = type;
    }
    this.applyFilters();
  }

  getPersonaTypeBadgeClass(tipo: string): string {
    return this.getPersonaTypeClass(tipo);
  }

  viewPersona(persona: PersonaTabla): void {
    this.verPersona(persona);
  }

  editPersona(persona: PersonaTabla): void {
    this.editarPersona(persona);
  }

  onSubmit(): void {
    if (this.activeSection === 'viajero-frecuente') {
      this.submitViajeroFrecuente();
    } else if (this.mostrarModalNatural) {
      this.onSubmitNatural();
    } else if (this.mostrarModalJuridica) {
      this.onSubmitJuridica();
    }
  }

  resetForm(): void {
    if (this.mostrarModalNatural) {
      this.personaNaturalForm.reset();
    } else if (this.mostrarModalJuridica) {
      this.personaJuridicaForm.reset();
    } else if (this.viajeroForm) {
      this.viajeroForm.reset();
    }
  }

  // Métodos para viajeros
  selectViajero(id: number): void {
    this.selectedViajeroId = id;
  }

  getSelectedViajeroName(): string {
    const viajero = this.viajeros.find(v => v.id === this.selectedViajeroId);
    return viajero ? `${viajero.nombres} ${viajero.apellidoPaterno}` : '';
  }

  clearViajeroSelection(): void {
    this.selectedViajeroId = null;
  }

  submitViajeroFrecuente(): void {
    if (this.viajeroFrecuenteForm.valid) {
      console.log('Guardar viajero frecuente:', this.viajeroFrecuenteForm.value);
      // Implementar lógica de guardado
    }
  }

  // Método para trackBy en ngFor
  trackByPersonaId(index: number, persona: PersonaTabla): number {
    return persona.id;
  }

  // Métodos auxiliares para formularios anidados
  isPersonaFieldInvalid(formType: 'natural' | 'juridica' | 'viajero', fieldName: string): boolean {
    let form: FormGroup;
    if (formType === 'natural') {
      form = this.personaNaturalForm;
    } else if (formType === 'juridica') {
      form = this.personaJuridicaForm;
    } else {
      form = this.viajeroForm;
    }
    
    const personaGroup = form.get('persona') as FormGroup;
    const field = personaGroup?.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getPersonaFieldError(formType: 'natural' | 'juridica' | 'viajero', fieldName: string): string {
    let form: FormGroup;
    if (formType === 'natural') {
      form = this.personaNaturalForm;
    } else if (formType === 'juridica') {
      form = this.personaJuridicaForm;
    } else {
      form = this.viajeroForm;
    }
    
    const personaGroup = form.get('persona') as FormGroup;
    const field = personaGroup?.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return 'Este campo es obligatorio';
      }
      if (field.errors['email']) {
        return 'Ingrese un email válido';
      }
      if (field.errors['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }

  // Inicialización de formularios
  private initializeForms(): void {
    this.personaNaturalForm = this.fb.group({
      nombres: [''],
      apellidos: [''],
      documento: [''],
      cliente: [false],
      categoria: [''],
      persona: this.fb.group({
        telefono: [''],
        email: ['', [Validators.email]],
        direccion: [''],
        observacion: ['']
      })
    });

    this.personaJuridicaForm = this.fb.group({
      razonSocial: [''],
      ruc: [''],
      persona: this.fb.group({
        telefono: [''],
        email: ['', [Validators.email]],
        direccion: [''],
        observacion: ['']
      })
    });

    this.viajeroForm = this.fb.group({
      nombres: [''],
      apellidoPaterno: [''],
      apellidoMaterno: [''],
      fechaNacimiento: [''],
      nacionalidad: [''],
      otraNacionalidad: [''],
      residencia: [''],
      otraResidencia: [''],
      tipoDocumento: [''],
      numeroDocumento: [''],
      fechaEmisionDocumento: [''],
      fechaVencimientoDocumento: [''],
      persona: this.fb.group({
        telefono: [''],
        email: ['', [Validators.email]],
        direccion: [''],
        observacion: ['']
      })
    });

    this.viajeroFrecuenteForm = this.fb.group({
      numeroTarjeta: ['', [Validators.required]],
      aerolinea: ['', [Validators.required]],
      categoria: ['', [Validators.required]]
    });
  }

  // Carga de datos - solo personas naturales y jurídicas
  async loadPersonas(): Promise<void> {
    try {
      this.loading = true;
      this.isLoading = true;
      
      const [naturales, juridicas] = await Promise.all([
        this.personaNaturalService.findAll().toPromise(),
        this.personaJuridicaService.findAll().toPromise()
      ]);

      const personasTabla: PersonaTabla[] = [];

      // Agregar personas naturales
      if (naturales) {
        naturales.forEach(natural => {
          personasTabla.push({
            id: natural.id,
            tipo: 'natural',
            nombre: `${natural.nombres || ''} ${natural.apellidos || ''}`.trim(),
            nombres: natural.nombres,
            apellidos: natural.apellidos,
            documento: natural.documento || '',
            email: natural.persona?.email,
            telefono: natural.persona?.telefono,
            direccion: natural.persona?.direccion
          });
        });
      }

      // Agregar personas jurídicas
      if (juridicas) {
        juridicas.forEach(juridica => {
          personasTabla.push({
            id: juridica.id,
            tipo: 'juridica',
            nombre: juridica.razonSocial || '',
            razonSocial: juridica.razonSocial,
            documento: juridica.ruc || '',
            ruc: juridica.ruc,
            email: juridica.persona?.email,
            telefono: juridica.persona?.telefono,
            direccion: juridica.persona?.direccion
          });
        });
      }

      this.personas = personasTabla;
      this.applyFilters();
      
    } catch (error) {
      console.error('Error al cargar personas:', error);
    } finally {
      this.loading = false;
      this.isLoading = false;
    }
  }

  // Filtros y búsqueda
  applyFilters(): void {
    let filtered = [...this.personas];

    // Filtro por tipo
    if (this.selectedType !== 'todos') {
      filtered = filtered.filter(persona => persona.tipo === this.selectedType);
    }

    // Filtro por búsqueda - usar ambas variables
    const searchText = this.searchTerm || this.searchQuery;
    if (searchText.trim()) {
      const term = searchText.toLowerCase();
      filtered = filtered.filter(persona => {
        const searchableText = `${persona.nombre} ${persona.documento} ${persona.email || ''} ${persona.telefono || ''}`.toLowerCase();
        return searchableText.includes(term);
      });
    }

    this.filteredPersonas = filtered;
    this.personasFiltradas = filtered;
    this.totalItems = filtered.length;
    
    // Aplicar ordenamiento
    this.applySorting();
    
    this.calcularEstadisticas();
  }

  private applySorting(): void {
    if (!this.personasFiltradas.length) return;
    
    this.personasFiltradas.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (this.sortColumn) {
        case 'tipo':
          valueA = a.tipo;
          valueB = b.tipo;
          break;
        case 'nombre':
          valueA = a.nombre.toLowerCase();
          valueB = b.nombre.toLowerCase();
          break;
        case 'documento':
          valueA = a.documento || '';
          valueB = b.documento || '';
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  onSearchChange(): void {
    this.searchTerm = this.searchQuery; // Sincronizar las variables
    this.currentPage = 1;
    this.applyFilters();
  }

  onTypeFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  // Métodos de utilidad para mostrar datos
  getPersonaDisplayName(persona: PersonaTabla): string {
    return persona.nombre || 'Sin nombre';
  }

  getPersonaTypeLabel(tipo: string): string {
    return tipo === 'natural' ? 'Natural' : 'Jurídica';
  }

  getPersonaTypeClass(tipo: string): string {
    return tipo === 'natural' ? 'badge-natural' : 'badge-juridica';
  }

  // Gestión de modales - Persona Natural
  openPersonaNaturalModal(): void {
    this.isEditMode = false;
    this.currentPersonaId = null;
    this.activeTab = 'natural';
    this.personaNaturalForm.reset();
    this.personaNaturalForm.patchValue({
      cliente: false,
      categoria: ''
    });
    this.mostrarModalCrearCliente = true;
  }

  openEditPersonaNaturalModal(persona: PersonaTabla): void {
    if (persona.tipo !== 'natural') return;
    
    this.isEditMode = true;
    this.currentPersonaId = persona.id;
    
    // Cargar datos completos para edición
    this.personaNaturalService.findById(persona.id).subscribe({
      next: (personaCompleta) => {
        this.personaNaturalForm.patchValue({
          nombres: personaCompleta.nombres || '',
          apellidos: personaCompleta.apellidos || '',
          documento: personaCompleta.documento || '',
          cliente: personaCompleta.cliente || false,
          categoria: personaCompleta.categoria || '',
          persona: {
            telefono: personaCompleta.persona?.telefono || '',
            email: personaCompleta.persona?.email || '',
            direccion: personaCompleta.persona?.direccion || ''
          }
        });
      },
      error: (error) => {
        console.error('Error al cargar persona natural:', error);
      }
    });
  }

  closePersonaNaturalModal(): void {
    this.cerrarModalCrearCliente();
  }

  // Gestión de modales - Persona Jurídica
  openPersonaJuridicaModal(): void {
    this.isEditMode = false;
    this.currentPersonaId = null;
    this.activeTab = 'juridica';
    this.personaJuridicaForm.reset();
    this.mostrarModalCrearCliente = true;
  }

  openEditPersonaJuridicaModal(persona: PersonaTabla): void {
    if (persona.tipo !== 'juridica') return;
    
    this.isEditMode = true;
    this.currentPersonaId = persona.id;
    
    // Cargar datos completos para edición
    this.personaJuridicaService.findById(persona.id).subscribe({
      next: (personaCompleta) => {
        this.personaJuridicaForm.patchValue({
          razonSocial: personaCompleta.razonSocial || '',
          ruc: personaCompleta.ruc || '',
          persona: {
            telefono: personaCompleta.persona?.telefono || '',
            email: personaCompleta.persona?.email || '',
            direccion: personaCompleta.persona?.direccion || ''
          }
        });
      },
      error: (error) => {
        console.error('Error al cargar persona jurídica:', error);
      }
    });
  }

  closePersonaJuridicaModal(): void {
    this.cerrarModalCrearCliente();
  }

  // CRUD Operations - Persona Natural
  async onSubmitPersonaNatural(): Promise<void> {
    if (this.personaNaturalForm.invalid) {
      this.markFormGroupTouched(this.personaNaturalForm);
      return;
    }

    try {
      this.loading = true;
      const formData = this.personaNaturalForm.value;
      const request: PersonaNaturalRequest = {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        documento: formData.documento,
        cliente: formData.cliente,
        categoria: formData.categoria,
        persona: formData.persona
      };

      if (this.isEditMode && this.currentPersonaId) {
        this.personaNaturalService.update(this.currentPersonaId, request).subscribe({
          next: () => {
            // Deseleccionar el elemento editado
            this.selectedItems = this.selectedItems.filter(id => id !== this.currentPersonaId);
            this.updateSelectionState();
            this.loadPersonas();
            this.cerrarModalCrearCliente();
          },
          error: (error) => {
            console.error('Error al actualizar persona natural:', error);
            this.loading = false;
          }
        });
      } else {
        this.personaNaturalService.save(request).subscribe({
          next: () => {
            this.loadPersonas();
            this.cerrarModalCrearCliente();
          },
          error: (error) => {
            console.error('Error al crear persona natural:', error);
            this.loading = false;
          }
        });
      }
    } catch (error) {
      console.error('Error al guardar persona natural:', error);
      this.loading = false;
    }
  }

  // CRUD Operations - Persona Jurídica
  async onSubmitPersonaJuridica(): Promise<void> {
    if (this.personaJuridicaForm.invalid) {
      this.markFormGroupTouched(this.personaJuridicaForm);
      return;
    }

    try {
      this.loading = true;
      const formData = this.personaJuridicaForm.value;
      const request: PersonaJuridicaRequest = {
        razonSocial: formData.razonSocial,
        ruc: formData.ruc,
        persona: formData.persona
      };

      if (this.isEditMode && this.currentPersonaId) {
        this.personaJuridicaService.update(this.currentPersonaId, request).subscribe({
          next: () => {
            // Deseleccionar el elemento editado
            this.selectedItems = this.selectedItems.filter(id => id !== this.currentPersonaId);
            this.updateSelectionState();
            this.loadPersonas();
            this.cerrarModalCrearCliente();
          },
          error: (error) => {
            console.error('Error al actualizar persona jurídica:', error);
            this.loading = false;
          }
        });
      } else {
        this.personaJuridicaService.save(request).subscribe({
          next: () => {
            this.loadPersonas();
            this.cerrarModalCrearCliente();
          },
          error: (error) => {
            console.error('Error al crear persona jurídica:', error);
            this.loading = false;
          }
        });
      }
    } catch (error) {
      console.error('Error al guardar persona jurídica:', error);
      this.loading = false;
    }
  }

  // Eliminar persona
  async deletePersona(persona: PersonaTabla): Promise<void> {
    if (!confirm(`¿Está seguro de eliminar a ${this.getPersonaDisplayName(persona)}?`)) {
      return;
    }

    try {
      this.loading = true;
      
      if (persona.tipo === 'natural') {
        this.personaNaturalService.deleteById(persona.id).subscribe({
          next: () => {
            this.loadPersonas();
          },
          error: (error) => {
            console.error('Error al eliminar persona natural:', error);
            this.loading = false;
          }
        });
      } else {
        this.personaJuridicaService.deleteById(persona.id).subscribe({
          next: () => {
            this.loadPersonas();
          },
          error: (error) => {
            console.error('Error al eliminar persona jurídica:', error);
            this.loading = false;
          }
        });
      }
    } catch (error) {
      console.error('Error al eliminar persona:', error);
      this.loading = false;
    }
  }

  // Métodos de utilidad para formularios
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return 'Este campo es obligatorio';
      }
      if (field.errors['email']) {
        return 'Ingrese un email válido';
      }
      if (field.errors['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Métodos del Sidebar
  onSidebarItemClick(item: SidebarMenuItem): void { 
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  // Métodos para cambiar entre vistas
  changeView(view: 'table' | 'cards' | 'list'): void {
    this.currentView = view;
  }

  isActiveView(view: 'table' | 'cards' | 'list'): boolean {
    return this.currentView === view;
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
}
