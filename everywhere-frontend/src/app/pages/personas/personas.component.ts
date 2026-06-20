import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PersonaNaturalService } from '../../core/service/natural/persona-natural.service';
import { PersonaJuridicaService } from '../../core/service/juridica/persona-juridica.service';
import { PersonaService } from '../../core/service/persona/persona.service';
import { DetalleDocumentoService } from '../../core/service/DetalleDocumento/detalle-documento.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ClienteDetailModalComponent, DocumentoCliente } from './../../shared/components/cliente/cliente-detail-modal/cliente-detail-modal.component';
import { ClienteTableComponent } from './../../shared/components/cliente/cliente-table/cliente-table.component';
import { ErrorModalComponent, ErrorModalData } from '../../shared/components/error-modal/error-modal.component';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';
import { DetalleDocumentoConPersonasDto } from '../../shared/models/Documento/detalleDocumento.model';

export interface PersonaTabla {
  id: number;
  tipo: 'natural' | 'juridica';
  nombre: string;
  nombres?: string;
  apellidosPaterno?: string;
  apellidosMaterno?: string;
  razonSocial?: string;
  documento: string;
  ruc?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  documentos?: DocumentoCliente[];
}

@Component({
  selector: 'app-personas',
  standalone: true,
  templateUrl: './personas.component.html',
  styleUrls: ['./personas.component.css'],
  imports: [
    CommonModule,
    SidebarComponent,
    ClienteDetailModalComponent,
    ClienteTableComponent,
    ErrorModalComponent
  ]
})
export class PersonasComponent implements OnInit {

  // Sidebar
  sidebarCollapsed = false;
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

  // Data
  personas: PersonaTabla[] = [];
  personasOriginales: PersonaTabla[] = [];
  isLoading: boolean = false;
  modoVistaDocumentos: boolean = false;

  // Stats
  estadisticas = {
    totalNaturales: 0,
    totalJuridicas: 0
  };

  // Paginación Server-Side
  currentPage = 1;
  pageSize = 10;
  sortColumn = 'id';
  sortDirection = 'desc';
  searchTerm = '';
  typeFilter = 'todos';
  totalServerItems = 0;

  // Modales
  mostrarModalDetalles: boolean = false;
  mostrarModalSeleccionTipo: boolean = false;
  personaDetalles: PersonaTabla | null = null;

  // Confirmación de eliminación
  showConfirmation: boolean = false;
  confirmationData: ErrorModalData = {
    type: 'warning',
    title: 'Confirmar eliminación',
    message: '¿Está seguro de que desea eliminar este cliente?',
    buttonText: 'Eliminar'
  };
  private pendingClienteToDelete: PersonaTabla | null = null;
  private pendingIdsToDelete: number[] = [];

  // Modal de error
  showErrorModal: boolean = false;
  errorModalData: ErrorModalData = {
    type: 'error',
    title: '',
    message: '',
    buttonText: 'Entendido'
  };

  constructor(
    private personaNaturalService: PersonaNaturalService,
    private personaJuridicaService: PersonaJuridicaService,
    private personaService: PersonaService,
    private detalleDocumentoService: DetalleDocumentoService,
    private router: Router,
    private menuConfigService: MenuConfigService
  ) { }

  ngOnInit(): void {
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/people');
    this.loadPersonas();
    this.loadStats();
  }

  async loadStats(): Promise<void> {
    try {
      const stats = await this.personaService.getPersonaStats().toPromise();
      if (stats) {
        this.estadisticas.totalNaturales = stats.totalNaturales;
        this.estadisticas.totalJuridicas = stats.totalJuridicas;
      }
    } catch (error) {
      console.error('Error cargando stats de personas:', error);
    }
  }

  // ============ SIDEBAR ============ 

  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: ExtendedSidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  // ============ DATA LOADING ============

  async loadPersonas(): Promise<void> {
    try {
      this.isLoading = true;
      this.modoVistaDocumentos = false;

      // Paginación base 0 en Spring Boot
      const response = await this.personaService.getPersonasPage(
        this.currentPage - 1, 
        this.pageSize, 
        this.sortColumn, 
        this.sortDirection,
        this.searchTerm,
        this.typeFilter
      ).toPromise();

      if (response && response.content) {
        this.personas = response.content as PersonaTabla[];
        this.personasOriginales = [...this.personas];
        this.totalServerItems = response.totalElements;
      }

    } catch (error) {
      console.error('Error al cargar personas:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // ============ EVENTOS PAGINACIÓN SERVER-SIDE ============

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadPersonas();
  }

  onSortChange(sort: { column: string, direction: 'asc' | 'desc' }): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction;
    this.loadPersonas();
  }

  onFilterChange(filter: { searchTerm: string, typeFilter: string }): void {
    this.searchTerm = filter.searchTerm;
    this.typeFilter = filter.typeFilter;
    this.currentPage = 1;
    this.loadPersonas();
  }

  // ============ MODALES ============

  abrirModalSeleccionTipo(): void {
    this.mostrarModalSeleccionTipo = true;
  }

  cerrarModalSeleccionTipo(): void {
    this.mostrarModalSeleccionTipo = false;
  }

  crearPersonaNatural(): void {
    this.cerrarModalSeleccionTipo();
    this.router.navigate(['/people/detalle', 'nuevo']);
  }

  crearPersonaJuridica(): void {
    this.cerrarModalSeleccionTipo();
    this.router.navigate(['/legal/detalle', 'nuevo']);
  }

  // ============ CLIENTE TABLE EVENTOS ============

  onVerCliente(cliente: PersonaTabla): void {
    this.personaDetalles = cliente;
    this.mostrarModalDetalles = true;
  }

  onEditarCliente(cliente: PersonaTabla): void {
    if (cliente.tipo === 'natural') {
      this.router.navigate(['/people/detalle', cliente.id]);
    } else {
      this.router.navigate(['/legal/detalle', cliente.id]);
    }
  }

  onEliminarCliente(cliente: PersonaTabla): void {
    this.pendingClienteToDelete = cliente;
    this.confirmationData = {
      type: 'warning',
      title: 'Confirmar eliminación',
      message: `¿Está seguro de que desea eliminar a ${cliente.nombre}?`,
      buttonText: 'Eliminar'
    };
    this.showConfirmation = true;
  }

  onConfirmDelete(): void {
    if (this.pendingClienteToDelete) {
      const cliente = this.pendingClienteToDelete;
      this.isLoading = true;
      this.showConfirmation = false;

      if (cliente.tipo === 'natural') {
        this.personaNaturalService.deleteById(cliente.id).subscribe({
          next: () => this.loadPersonas(),
          error: (error) => {
            console.error('Error al eliminar persona natural:', error);
            this.mostrarError('Error al eliminar', error);
            this.isLoading = false;
          }
        });
      } else {
        this.personaJuridicaService.deleteById(cliente.id).subscribe({
          next: () => this.loadPersonas(),
          error: (error) => {
            console.error('Error al eliminar persona jurídica:', error);
            this.mostrarError('Error al eliminar', error);
            this.isLoading = false;
          }
        });
      }

      this.pendingClienteToDelete = null;
    } else if (this.pendingIdsToDelete.length > 0) {
      this.showConfirmation = false;
      this.performMasiveDelete();
    }
  }

  onCancelDelete(): void {
    this.showConfirmation = false;
    this.pendingClienteToDelete = null;
    this.pendingIdsToDelete = [];
  }

  onEliminarMasivo(ids: number[]): void {
    this.pendingIdsToDelete = ids;
    this.confirmationData = {
      type: 'warning',
      title: 'Confirmar eliminación masiva',
      message: `¿Está seguro de que desea eliminar ${ids.length} cliente(s)? Esta acción no se puede deshacer.`,
      buttonText: 'Eliminar todos'
    };
    this.showConfirmation = true;
  }

  private performMasiveDelete(): void {
    const ids = this.pendingIdsToDelete;
    this.isLoading = true;
    let eliminados = 0;
    const total = ids.length;

    ids.forEach(id => {
      const persona = this.personas.find(p => p.id === id);
      if (persona) {
        if (persona.tipo === 'natural') {
          this.personaNaturalService.deleteById(id).subscribe({
            next: () => {
              eliminados++;
              if (eliminados === total) {
                this.pendingIdsToDelete = [];
                this.loadPersonas();
              }
            },
            error: (error) => {
              console.error('Error al eliminar:', error);
              this.mostrarError('Error al eliminar', error);
              eliminados++;
              if (eliminados === total) {
                this.pendingIdsToDelete = [];
                this.loadPersonas();
              }
            }
          });
        } else {
          this.personaJuridicaService.deleteById(id).subscribe({
            next: () => {
              eliminados++;
              if (eliminados === total) {
                this.pendingIdsToDelete = [];
                this.loadPersonas();
              }
            },
            error: (error) => {
              console.error('Error al eliminar:', error);
              this.mostrarError('Error al eliminar', error);
              eliminados++;
              if (eliminados === total) {
                this.pendingIdsToDelete = [];
                this.loadPersonas();
              }
            }
          });
        }
      }
    });
  }

  // ============ DETAIL MODAL EVENTOS ============

  cerrarModalDetalles(): void {
    this.mostrarModalDetalles = false;
    this.personaDetalles = null;
  }

  onEditarCompleto(cliente: PersonaTabla): void {
    if (cliente.tipo === 'natural') {
      this.router.navigate(['/people/detalle', cliente.id]);
    } else {
      this.router.navigate(['/legal/detalle', cliente.id]);
    }
    this.cerrarModalDetalles();
  }

  // Manejo de errores
  private mostrarError(title: string, error: any): void {
    if (error && (error as any).isHandledGlobally) {
      return;
    }
    
    let message = 'Ha ocurrido un error inesperado.';

    // Extraer mensaje del backend si existe
    if (error?.error?.detail) {
      message = error.error.detail;
    } else if (error?.detail) {
      message = error.detail;
    } else if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    this.errorModalData = {
      type: 'error',
      title,
      message,
      buttonText: 'Entendido'
    };
    this.showErrorModal = true;
  }

  cerrarErrorModal(): void {
    this.showErrorModal = false;
  }

  // ============ BÚSQUEDA POR DOCUMENTO ============

  onBuscarPorDocumento(numero: string): void {
    if (!numero || numero.trim().length === 0) {
      this.modoVistaDocumentos = false;
      this.personas = [...this.personasOriginales];
      return;
    }

    this.isLoading = true;
    this.modoVistaDocumentos = false; // Ocultar banner hasta que termine la búsqueda
    
    this.detalleDocumentoService.buscarPorNumeroDocumento(numero).subscribe({
      next: async (resultados) => {
        const personasDesdeDocumentos: PersonaTabla[] = [];
        
        for (const doc of resultados) {
          for (const persona of doc.personas) {
            try {
              // Obtenemos los datos básicos (nombre, tipo, identificador)
              const displayInfo = await this.personaService.findPersonaNaturalOrJuridicaById(persona.personaId).toPromise();
              // Obtenemos datos de contacto (direccion, correos, telefonos)
              const contactInfo = await this.personaService.findById(persona.personaId).toPromise();
              
              if (displayInfo && contactInfo) {
                const tipo = displayInfo.tipo.toLowerCase() as 'natural' | 'juridica';
                
                personasDesdeDocumentos.push({
                  id: displayInfo.id,
                  tipo: tipo,
                  nombre: displayInfo.nombre,
                  documento: tipo === 'natural' ? displayInfo.identificador : '',
                  ruc: tipo === 'juridica' ? displayInfo.identificador : '',
                  email: contactInfo.correos && contactInfo.correos.length > 0 ? contactInfo.correos[0].email : '',
                  telefono: contactInfo.telefonos && contactInfo.telefonos.length > 0 ? contactInfo.telefonos[0].numero : '',
                  direccion: contactInfo.direccion,
                  // Info extra del tipo de documento para mostrarlo en el banner
                  documentos: [{
                    numero: doc.numeroDocumento,
                    tipo: doc.tipoDocumento,
                    origen: ''
                  }]
                });
              }
            } catch (err) {
              console.error('Error obteniendo detalles de la persona con ID:', persona.personaId, err);
            }
          }
        }
        
        this.personas = personasDesdeDocumentos;
        this.totalServerItems = personasDesdeDocumentos.length;
        this.modoVistaDocumentos = true; // Mostrar banner solo si hay resultados
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al buscar documentos:', error);
        this.mostrarError('Error en búsqueda', error);
        this.isLoading = false;
        this.modoVistaDocumentos = false;
      }
    });
  }

  onVolverAVistaNormal(): void {
    this.modoVistaDocumentos = false;
    this.personas = [...this.personasOriginales];
  }
}