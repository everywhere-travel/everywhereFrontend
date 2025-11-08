import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PersonaNaturalService } from '../../core/service/natural/persona-natural.service';
import { PersonaJuridicaService } from '../../core/service/juridica/persona-juridica.service';
import { AuthServiceService } from '../../core/service/auth/auth.service';
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';
import { ClienteDetailModalComponent } from './../../shared/components/cliente/cliente-detail-modal/cliente-detail-modal.component';
import { ClienteTableComponent } from './../../shared/components/cliente/cliente-table/cliente-table.component';

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
    ClienteTableComponent
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
      id: 'categorias',
      title: 'Categorias',
      icon: 'fas fa-box',
      children: [
        {
          id: 'categorias-persona',
          title: 'Categorias de Persona',
          icon: 'fas fa-cube',
          route: '/categorias-persona',
          moduleKey: 'CATEGORIA_PERSONAS'
        },
        {
          id: 'estado-cotizacion',
          title: 'Estado de Cotización',
          icon: 'fas fa-clipboard-check',
          route: '/estado-cotizacion',
          moduleKey: 'COTIZACIONES'
        },
        {
          id: 'categorias-producto',
          title: 'Categorias de Producto',
          icon: 'fas fa-cube',
          route: '/categorias',
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
    if (!confirm(`¿Está seguro de eliminar a ${cliente.nombre}?`)) {
      return;
    }

    this.isLoading = true;

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
  }

  onEliminarMasivo(ids: number[]): void {
    if (!confirm(`¿Está seguro de eliminar ${ids.length} cliente(s)?`)) {
      return;
    }

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
                this.loadPersonas();
              }
            },
            error: (error) => {
              console.error('Error al eliminar:', error);
              eliminados++;
              if (eliminados === total) {
                this.loadPersonas();
              }
            }
          });
        } else {
          this.personaJuridicaService.deleteById(id).subscribe({
            next: () => {
              eliminados++;
              if (eliminados === total) {
                this.loadPersonas();
              }
            },
            error: (error) => {
              console.error('Error al eliminar:', error);
              eliminados++;
              if (eliminados === total) {
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
