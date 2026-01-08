import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PersonaNaturalService } from '../../core/service/natural/persona-natural.service';
import { PersonaJuridicaService } from '../../core/service/juridica/persona-juridica.service';
import { DetalleDocumentoService } from '../../core/service/DetalleDocumento/detalle-documento.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ClienteDetailModalComponent, DocumentoCliente } from './../../shared/components/cliente/cliente-detail-modal/cliente-detail-modal.component';
import { ErrorModalComponent, ErrorModalData } from '../../shared/components/error-modal/error-modal.component';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';

// ===== NUEVO: Importar DataTable =====
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { DataTableConfig } from '../../shared/components/data-table/data-table.config';

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
    selector: 'app-personas-test',
    standalone: true,
    templateUrl: './personas-test.component.html',
    styleUrls: ['./personas.component.css'], // Reutilizamos el CSS original
    imports: [
        CommonModule,
        SidebarComponent,
        ClienteDetailModalComponent,
        ErrorModalComponent,
        DataTableComponent // ✅ Agregado
    ]
})
export class PersonasTestComponent implements OnInit {

    // Sidebar
    sidebarCollapsed = false;
    sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

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

    // Modal de error
    showErrorModal: boolean = false;
    errorModalData: ErrorModalData = {
        type: 'error',
        title: '',
        message: '',
        buttonText: 'Entendido'
    };

    // ===== Configuración del DataTable =====
    tableConfig: DataTableConfig<PersonaTabla> = {
        data: [],
        columns: [
            {
                key: 'tipo',
                header: 'Tipo',
                icon: 'fa-tag',
                sortable: true,
                align: 'center',
                width: '100px',
                render: (item) => item.tipo === 'natural' ? 'NATURAL' : 'JURÍDICA'
            },
            {
                key: 'nombre',
                header: 'Nombre / Razón Social',
                icon: 'fa-user',
                sortable: true
            },
            {
                key: 'email',
                header: 'Email',
                icon: 'fa-envelope',
                sortable: true,
                render: (item) => item.email || 'SIN EMAIL'
            },
            {
                key: 'telefono',
                header: 'Teléfono',
                icon: 'fa-phone',
                sortable: false,
                render: (item) => item.telefono || 'SIN TELÉFONO'
            }
        ],
        enableSearch: true,
        searchPlaceholder: 'Buscar por nombre, documento, email...',
        enableSelection: true,
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
                handler: (item) => this.onVerCliente(item)
            },
            {
                icon: 'fa-edit',
                label: 'Editar',
                color: 'blue',
                handler: (item) => this.onEditarCliente(item)
            },
            {
                icon: 'fa-trash',
                label: 'Eliminar',
                color: 'red',
                handler: (item) => this.onEliminarCliente(item)
            }
        ],
        bulkActions: [
            {
                icon: 'fa-trash',
                label: 'Eliminar seleccionados',
                color: 'red',
                handler: (items) => this.onEliminarMasivo(items.map(i => i.id)),
                confirm: {
                    title: 'Eliminar múltiples clientes',
                    message: 'Esta acción no se puede deshacer'
                }
            }
        ],
        emptyMessage: 'No se encontraron clientes',
        loadingMessage: 'Cargando clientes...',
        defaultView: 'table',
        enableRowHover: true,
        trackByKey: 'id'
    };

    constructor(
        private personaNaturalService: PersonaNaturalService,
        private personaJuridicaService: PersonaJuridicaService,
        private detalleDocumentoService: DetalleDocumentoService,
        private router: Router,
        private menuConfigService: MenuConfigService
    ) { }

    ngOnInit(): void {
        this.sidebarMenuItems = this.menuConfigService.getMenuItems('/personas');
        this.loadPersonas();
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

            const [naturales, juridicas] = await Promise.all([
                this.personaNaturalService.findAll().toPromise(),
                this.personaJuridicaService.findAll().toPromise()
            ]);

            const personasTabla: PersonaTabla[] = [];

            if (naturales) {
                const naturalesConDocumentos = await Promise.all(
                    naturales.map(async natural => {
                        try {
                            const documentos = await this.detalleDocumentoService.findByPersonaNaturalId(natural.id).toPromise();
                            return {
                                natural,
                                documentos: documentos?.map(doc => ({
                                    numero: doc.numero || '',
                                    tipo: doc.documento?.tipo || '',
                                    origen: doc.origen || ''
                                })) || []
                            };
                        } catch (error) {
                            console.error(`Error al cargar documentos para persona ${natural.id}:`, error);
                            return { natural, documentos: [] };
                        }
                    })
                );

                naturalesConDocumentos.forEach(({ natural, documentos }) => {
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
                        direccion: natural.persona?.direccion,
                        documentos: documentos
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

            // ===== ACTUALIZAR CONFIGURACIÓN DE LA TABLA =====
            console.log('✅ Datos cargados:', this.personas.length, 'clientes');
            console.log('📋 Muestra de datos:', this.personas.slice(0, 2));
            this.tableConfig.data = this.personas;
            console.log('🔄 TableConfig actualizado, data length:', this.tableConfig.data.length);

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

    // ============ ACCIONES DE LA TABLA ============

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
            this.router.navigate(['/personas/detalle', cliente.id]);
        } else {
            this.router.navigate(['/juridico/detalle', cliente.id]);
        }
        this.cerrarModalDetalles();
    }

    // Manejo de errores
    private mostrarError(title: string, error: any): void {
        let message = 'Ha ocurrido un error inesperado.';

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
}
