import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { PersonaService } from '../../core/service/persona/persona.service';
import { CotizacionService } from '../../core/service/Cotizacion/cotizacion.service';
import { PersonaNaturalService } from '../../core/service/natural/persona-natural.service';
import { PersonaJuridicaService } from '../../core/service/juridica/persona-juridica.service';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';

import { personaDisplay } from '../../shared/models/Persona/persona.model';
import { CotizacionResponse } from '../../shared/models/Cotizacion/cotizacion.model';
import { PersonaNaturalResponse } from '../../shared/models/Persona/personaNatural.model';
import { PersonaJuridicaResponse } from '../../shared/models/Persona/personaJuridica.models';

import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { DataTableConfig } from '../../shared/components/data-table/data-table.config';

export interface CotizacionTabla {
  id: number;
  codigoCotizacion: string;
  nombreCotizacion: string;
  cliente: string;
  clienteId: number;
  fechaEmision: string;
  fechaVencimiento: string;
  cantAdultos: number;
  cantNinos: number;
  estado: string;
  estadoId: number;
  moneda: string;
  total: number;
  cotizacionOriginal: CotizacionResponse;
}

@Component({
  selector: 'app-cotizaciones',
  standalone: true,
  templateUrl: './cotizaciones.component.html',
  styleUrls: ['./cotizaciones.component.css'],
  imports: [CommonModule, SidebarComponent, DataTableComponent],
})

export class CotizacionesComponent implements OnInit {
  personasCache: { [id: number]: personaDisplay } = {};
  personasDisplayMap: { [id: number]: string } = {};

  private router = inject(Router);
  private cotizacionService = inject(CotizacionService);
  private personaService = inject(PersonaService);
  private personaNaturalService = inject(PersonaNaturalService);
  private personaJuridicaService = inject(PersonaJuridicaService);

  isLoading = false;

  errorMessage: string = '';
  successMessage: string = '';
  showErrorMessage: boolean = false;
  showSuccessMessage: boolean = false;

  totalItems = 0;

  sidebarCollapsed = false;
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];
  
  cotizaciones: CotizacionResponse[] = [];
  personas: (PersonaNaturalResponse | PersonaJuridicaResponse)[] = [];

  cotizacionesTabla: CotizacionTabla[] = [];

  tableConfig: DataTableConfig<CotizacionTabla> = {
    data: [],
    columns: [
      {
        key: 'codigoCotizacion',
        header: 'Código',
        icon: 'fa-hashtag',
        sortable: true,
        width: '120px',
      },
      {
        key: 'cliente',
        header: 'Cliente',
        icon: 'fa-user',
        sortable: true,
      },
      {
        key: 'fechaEmision',
        header: 'Emisión',
        icon: 'fa-calendar',
        sortable: true,
        render: (item: CotizacionTabla) => this.formatDate(item.fechaEmision),
      },
      {
        key: 'fechaVencimiento',
        header: 'Venc.',
        icon: 'fa-calendar-check',
        sortable: true,
        render: (item: CotizacionTabla) => this.formatDate(item.fechaVencimiento),
      },
      {
        key: 'cantAdultos',
        header: 'Pasajeros',
        icon: 'fa-users',
        sortable: true,
        align: 'center',
        render: (item: CotizacionTabla) => {
          let text = `${item.cantAdultos} adulto${item.cantAdultos !== 1 ? 's' : ''}`;
          if (item.cantNinos > 0) {
            text += ` | ${item.cantNinos} niño${item.cantNinos !== 1 ? 's' : ''}`;
          }
          return text;
        },
      },
      {
        key: 'estado',
        header: 'Estado',
        icon: 'fa-info-circle',
        sortable: true,
        align: 'center',
      },

    ],
    enableSearch: true,
    searchPlaceholder: 'Buscar por código, nombre o cliente...',
    enableSelection: false,
    enablePagination: true,
    enableViewSwitcher: true,
    enableSorting: true,
    itemsPerPage: 10,
    pageSizeOptions: [5, 10, 25, 50],
    actions: [
      {
        icon: 'fa-eye',
        label: 'Ver',
        color: 'green',
        handler: (item: CotizacionTabla) => this.navegarADetalle(item.cotizacionOriginal.id),
      },
      {
        icon: 'fa-edit',
        label: 'Editar',
        color: 'blue',
        handler: (item: CotizacionTabla) => this.navegarADetalle(item.cotizacionOriginal.id, true),
      },
      {
        icon: 'fa-file-word',
        label: 'Word',
        color: 'indigo',
        handler: (item: CotizacionTabla) => this.descargarWord(item.cotizacionOriginal),
      },
      {
        icon: 'fa-history',
        label: 'Historial',
        color: 'blue',
        handler: (item: CotizacionTabla) => this.navegarAHistorial(item.cotizacionOriginal.id),
      },
      {
        icon: 'fa-trash',
        label: 'Eliminar',
        color: 'red',
        handler: (item: CotizacionTabla) => this.confirmarEliminacion(item.cotizacionOriginal),
      },
    ],
    bulkActions: [],
    emptyMessage: 'No se encontraron cotizaciones',
    loadingMessage: 'Cargando cotizaciones...',
    defaultView: 'table',
    enableRowHover: true,
    trackByKey: 'id',
  };

  constructor(private menuConfigService: MenuConfigService) { }

  ngOnInit(): void {
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/quotes');
    this.loadInitialData();
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.showErrorMessage = true;
    this.showSuccessMessage = false;
    setTimeout(() => {
      this.showErrorMessage = false;
    }, 5000);
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.showSuccessMessage = true;
    this.showErrorMessage = false;
    setTimeout(() => {
      this.showSuccessMessage = false;
    }, 3000);
  }

  hideMessages(): void {
    this.showErrorMessage = false;
    this.showSuccessMessage = false;
  }

  private loadInitialData(): void {
    this.isLoading = true;
    Promise.all([
      this.loadPersonas(),
      this.loadCotizaciones()
    ]).then(async () => {
      await this.findAndLoadMissingClients();
      this.updateTableConfig();
    }).finally(() => {
      this.isLoading = false;
    });
  }


  private async loadCotizaciones(): Promise<void> {
    try {
      this.isLoading = true;

      this.cotizaciones = (await this.cotizacionService.getAllCotizaciones().toPromise()) || [];
      this.updateTableConfig();
    } catch (error) {
      this.showError('Error al cargar las cotizaciones. Por favor, recargue la página.');
      this.cotizaciones = [];
    } finally {
      this.isLoading = false;
    }
  }

  private async loadPersonas(): Promise<void> {
    try {
      const personasNaturales = (await this.personaNaturalService.getDropdown().toPromise()) || [];
      const personasJuridicas = (await this.personaJuridicaService.getDropdown().toPromise()) || [];
      this.personas = [...personasNaturales, ...personasJuridicas];
      this.personas.forEach((persona) => {
        const personaId = persona.persona?.id || persona.id;
        if (!personaId) return;

        if ('ruc' in persona) {
          const pj = persona as PersonaJuridicaResponse;
          this.personasCache[personaId] = {
            id: personaId,
            identificador: pj.ruc || '',
            nombre: String(pj.razonSocial || '').replace(/null|undefined/gi, '').trim() || 'Sin nombre',
            tipo: 'JURIDICA',
          };
        } else {
          const pn = persona as PersonaNaturalResponse;
          const safeStr = (str: any) => String(str || '').replace(/null|undefined/gi, '').trim();
          
          const nombres = safeStr(pn.nombres);
          const apellidoPaterno = safeStr(pn.apellidosPaterno || (pn as any).apellidoPaterno);
          const apellidoMaterno = safeStr(pn.apellidosMaterno || (pn as any).apellidoMaterno);
          
          const fullName = [nombres, apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ');
          
          this.personasCache[personaId] = {
            id: personaId,
            identificador: pn.documento || '',
            nombre: fullName || 'Sin nombre',
            tipo: 'NATURAL',
          };
        }

        const cached = this.personasCache[personaId];
        this.personasDisplayMap[personaId] = cached.nombre;
      });
    } catch (error) {
      this.showError(
        'Error al cargar los clientes. Algunas funciones pueden no estar disponibles.',
      );
      this.personas = [];
    }
  }

    private async findAndLoadMissingClients(): Promise<void> {
    try {
      // 1. Ver qué IDs de clientes hay en las cotizaciones
      const personaIdsEnCotizaciones = new Set<number>();
      this.cotizaciones.forEach((cotizacion) => {
        if (cotizacion.personas?.id) {
          personaIdsEnCotizaciones.add(cotizacion.personas.id);
        }
      });

      // 2. Ver cuáles de esos IDs faltan en nuestro cache
      const idsEnCache = new Set(Object.keys(this.personasCache).map((id) => parseInt(id)));
      const idsFaltantes = Array.from(personaIdsEnCotizaciones).filter((id) => !idsEnCache.has(id));

      if (idsFaltantes.length === 0) return;

      // 3. Descargar solo a los clientes que faltan
      const clientesFaltantes = await Promise.all(
        idsFaltantes.map(async (personaId) => {
          try {
            return await this.personaService.findPersonaNaturalOrJuridicaByIdDropdown(personaId).toPromise();
          } catch (error) {
            return { id: personaId, tipo: 'UNKNOWN', identificador: '', nombre: `Cliente N/A (ID: ${personaId})` };
          }
        })
      );

      // 4. Agregarlos al cache para que la tabla pueda leer sus nombres
      clientesFaltantes.forEach((cliente: any) => {
        if (cliente && cliente.id) {
          const esGenerico = cliente.tipo === 'GENERICA' || !cliente.identificador;
          this.personasCache[cliente.id] = {
            id: cliente.id,
            identificador: cliente.identificador || '',
            nombre: cliente.nombre || `Cliente ID: ${cliente.id}`,
            tipo: esGenerico ? 'UNKNOWN' : cliente.tipo,
          };
          this.personasDisplayMap[cliente.id] = esGenerico ? `Cliente ID: ${cliente.id} (Sin datos)` : cliente.nombre;
        }
      });
    } catch (error) {
      console.error('Error cargando clientes faltantes:', error);
    }
  }

  
  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: SidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  private updateTableConfig(): void {
    this.cotizacionesTabla = this.cotizaciones.map((c) => ({
      id: c.id,
      codigoCotizacion: c.codigoCotizacion || '',
      nombreCotizacion: c.nombreCotizacion || 'Sin nombre',
      cliente: this.getPersonaDisplayName(c.personas?.id || 0),
      clienteId: c.personas?.id || 0,
      fechaEmision: c.fechaEmision || '',
      fechaVencimiento: c.fechaVencimiento || '',
      cantAdultos: c.cantAdultos || 0,
      cantNinos: c.cantNinos || 0,
      estado: c.estadoCotizacion?.descripcion || 'Sin estado',
      estadoId: c.estadoCotizacion?.id || 0,
      moneda: c.moneda || 'USD',
      total: 0,
      cotizacionOriginal: c,
    }));

    this.tableConfig = {
      ...this.tableConfig,
      data: this.cotizacionesTabla,
    };
    
    this.totalItems = this.cotizacionesTabla.length;
  }

  confirmarEliminacion(cotizacion: CotizacionResponse): void {
    if (confirm(`¿Estás seguro de que deseas eliminar la cotización ${cotizacion.codigoCotizacion}?`)) {
      this.eliminarCotizacionDirectamente(cotizacion.id);
    }
  } 

  mostrarFormularioCrear(): void {
    this.router.navigate(['/quotes/crear']);
  }

  navegarADetalle(cotizacionId: number | undefined, modoEdicion: boolean = false): void {
    if (!cotizacionId) {
      this.showError('ID de cotización no válido');
      return;
    }

    if (modoEdicion) {
      this.router.navigate(['/quotes/detalle', cotizacionId], {
        queryParams: { modo: 'editar' }
      });
    } else {
      this.router.navigate(['/quotes/detalle', cotizacionId]);
    }
  }

  navegarAHistorial(cotizacionId: number | undefined): void {
    if (!cotizacionId) {
      this.showError('ID de cotización no válido');
      return;
    }

    this.router.navigate(['/quotes/detalle', cotizacionId], {
      queryParams: { seccion: 'historial' }
    });
  }


  descargarWord(cotizacion: CotizacionResponse): void {
    if (!cotizacion || !cotizacion.id) {
      this.showError('No se puede generar el documento. Cotización inválida.');
      return;
    }

    this.isLoading = true;
    this.cotizacionService.descargarDocx(cotizacion.id, cotizacion.codigoCotizacion);

    setTimeout(() => {
      this.isLoading = false;
      this.showSuccess('Documento Word generado correctamente');
    }, 1000);
  }

  private async eliminarCotizacionDirectamente(id: number): Promise<void> {
    this.isLoading = true;

    try {
      await this.cotizacionService.deleteByIdCotizacion(id).toPromise();
      await this.loadCotizaciones();
      this.showSuccess('Cotización eliminada exitosamente.');
    } catch (error: any) {
      const errorMessage =
        error?.error?.detail ||
        error?.error?.message ||
        error?.message ||
        'Error al eliminar la cotización. Por favor, inténtelo de nuevo.';
      this.showError(errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  getPersonaDisplayName(personaId: number): string {
    if (!personaId || personaId === 0) {
      return 'Sin cliente';
    }

    if (this.personasDisplayMap[personaId]) {
      return this.personasDisplayMap[personaId];
    }
    return 'Cliente no encontrado';
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES');
  }

  getTotalCotizaciones(): number {
    return this.cotizaciones.length;
  }
}