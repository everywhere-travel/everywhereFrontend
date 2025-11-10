import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PersonaNaturalService } from '../../core/service/natural/persona-natural.service';
import { PersonaJuridicaService } from '../../core/service/juridica/persona-juridica.service';
import { AuthServiceService } from '../../core/service/auth/auth.service';
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';
import { ClienteDetailModalComponent } from './../../shared/components/cliente/cliente-detail-modal/cliente-detail-modal.component';
import { ClienteTableComponent } from './../../shared/components/cliente/cliente-table/cliente-table.component';
import { ErrorModalComponent, ErrorModalData } from '../../shared/components/error-modal/error-modal.component';

interface ExtendedSidebarMenuItem extends SidebarMenuItem {
  moduleKey?: string;
  children?: ExtendedSidebarMenuItem[];
}

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
  private allSidebarMenuItems: ExtendedSidebarMenuItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'fas fa-chart-pie',
      route: '/dashboard'
    },

    {
      id: 'clientes',
      title: 'Clientes',
      icon: 'fas fa-address-book',
      route: '/personas',
      active: true,
      moduleKey: 'PERSONAS'
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
      route: '/documentos-cobranza',
      moduleKey: 'DOCUMENTOS_COBRANZA'
    },
    {
      id: 'categorias',
      title: 'Gestion de Categorias',
      icon: 'fas fa-box',
      children: [
        {
          id: 'categorias-persona',
          title: 'Categorias de Persona',
          icon: 'fas fa-users',
          route: '/categorias-persona',
          moduleKey: 'CATEGORIA_PERSONAS'
        },
        {
          id: 'categorias-producto',
          title: 'Categorias de Producto',
          icon: 'fas fa-list',
          route: '/categorias',
        },
        {
          id: 'estado-cotizacion',
          title: 'Estado de Cotización',
          icon: 'fas fa-clipboard-check',
          route: '/estado-cotizacion',
          moduleKey: 'COTIZACIONES'
        },
        {
          id: 'forma-pago',
          title: 'Forma de Pago',
          icon: 'fas fa-credit-card',
          route: '/formas-pago',
          moduleKey: 'FORMA_PAGO'
        }
      ]
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
          id: 'sucursales',
          title: 'Sucursales',
          icon: 'fas fa-building',
          route: '/sucursales',
          moduleKey: 'SUCURSALES'
        }
      ]
    }
  ];

  // Data
  personas: PersonaTabla[] = [];
  isLoading: boolean = false;

  // Stats
  estadisticas = {
    totalNaturales: 0,
    totalJuridicas: 0
  };

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

  constructor(
    private personaNaturalService: PersonaNaturalService,
    private personaJuridicaService: PersonaJuridicaService,
    private router: Router,
    private authService: AuthServiceService
  ) {}

  ngOnInit(): void {
    this.initializeSidebar();
    this.loadPersonas();
  }

  // ============ SIDEBAR ============

  private initializeSidebar(): void {
    const authData = this.authService.getUser();
    const userPermissions = authData?.permissions || {};

    if (userPermissions['ALL_MODULES']) {
      this.sidebarMenuItems = this.allSidebarMenuItems;
    } else {
      this.sidebarMenuItems = this.filterSidebarItems(this.allSidebarMenuItems, userPermissions);
    }
  }

  private filterSidebarItems(items: ExtendedSidebarMenuItem[], userPermissions: any): ExtendedSidebarMenuItem[] {
    return items.filter(item => {
      if (item.id === 'dashboard') {
        return true;
      }

      if (!item.moduleKey) {
        if (item.children) {
          const filteredChildren = this.filterSidebarItems(item.children, userPermissions);
          if (filteredChildren.length > 0) {
            return true;
          }
          return false;
        }
        return true;
      }

      const hasPermission = Object.keys(userPermissions).includes(item.moduleKey);

      if (hasPermission) {
        if (item.children) {
          const filteredChildren = this.filterSidebarItems(item.children, userPermissions);
          item.children = filteredChildren;
        }
        return true;
      }

      return false;
    });
  }

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

      const [naturales, juridicas] = await Promise.all([
        this.personaNaturalService.findAll().toPromise(),
        this.personaJuridicaService.findAll().toPromise()
      ]);

      const personasTabla: PersonaTabla[] = [];

      if (naturales) {
        naturales.forEach(natural => {
          personasTabla.push({
            id: natural.id,
            tipo: 'natural',
            nombre: `${natural.nombres || ''} ${natural.apellidosPaterno || ''} ${natural.apellidosMaterno || ''}`.trim(),
            nombres: natural.nombres,
            apellidosPaterno: natural.apellidosPaterno || '',
            apellidosMaterno: natural.apellidosMaterno || '',
            documento: natural.documento || '',
            email: natural.persona?.correos?.[0]?.email,
            telefono: natural.persona?.telefonos?.[0]?.numero,
            direccion: natural.persona?.direccion
          });
        });
      }

      if (juridicas) {
        juridicas.forEach(juridica => {
          personasTabla.push({
            id: juridica.id,
            tipo: 'juridica',
            nombre: juridica.razonSocial || '',
            apellidosPaterno: '',
            razonSocial: juridica.razonSocial,
            documento: juridica.ruc || '',
            ruc: juridica.ruc,
            email: juridica.persona?.correos?.[0]?.email,
            telefono: juridica.persona?.telefonos?.[0]?.numero,
            direccion: juridica.persona?.direccion
          });
        });
      }

      this.personas = personasTabla;
      this.calcularEstadisticas();

    } catch (error) {
      console.error('Error al cargar personas:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private calcularEstadisticas(): void {
    this.estadisticas.totalNaturales = this.personas.filter(p => p.tipo === 'natural').length;
    this.estadisticas.totalJuridicas = this.personas.filter(p => p.tipo === 'juridica').length;
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
  this.router.navigate(['/personas/detalle', 'nuevo']);
  }

  crearPersonaJuridica(): void {
  this.cerrarModalSeleccionTipo();
  this.router.navigate(['/juridico/detalle', 'nuevo']);
  }

  // ============ CLIENTE TABLE EVENTOS ============

  onVerCliente(cliente: PersonaTabla): void {
    this.personaDetalles = cliente;
    this.mostrarModalDetalles = true;
  }

  onEditarCliente(cliente: PersonaTabla): void {
    if (cliente.tipo === 'natural') {
      this.router.navigate(['/personas/detalle', cliente.id]);
    } else {
      this.router.navigate(['/juridico/detalle', cliente.id]);
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
            this.isLoading = false;
          }
        });
      } else {
        this.personaJuridicaService.deleteById(cliente.id).subscribe({
          next: () => this.loadPersonas(),
          error: (error) => {
            console.error('Error al eliminar persona jurídica:', error);
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
      this.router.navigate(['/personas/detalle', cliente.id]);
    } else {
      this.router.navigate(['/juridico/detalle', cliente.id]);
    }
    this.cerrarModalDetalles();
  }
}
