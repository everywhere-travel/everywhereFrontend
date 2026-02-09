import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';
import { ProveedorService } from '../../core/service/Proveedor/proveedor.service';
import { ProveedorColaboradorService } from '../../core/service/Proveedor/proveedor-colaborador.service';
import { ProveedorContactoService } from '../../core/service/Proveedor/proveedor-contacto.service';
import { ProveedorGrupoContactoService } from '../../core/service/Proveedor/proveedor-grupo-contacto.service';
import { ProveedorRequest, ProveedorResponse } from '../../shared/models/Proveedor/proveedor.model';
import { ProveedorColaboradorRequest, ProveedorColaboradorResponse } from '../../shared/models/Proveedor/proveedor-colaborador.model';
import { ProveedorContactoRequest, ProveedorContactoResponse } from '../../shared/models/Proveedor/proveedor-contacto.model';
import { ProveedorGrupoContactoRequest, ProveedorGrupoContactoResponse } from '../../shared/models/Proveedor/proveedor-grupo-contacto.model';
import { ConfirmationModalComponent, ConfirmationConfig } from '../../shared/components/confirmation-modal/confirmation-modal.component';

interface CodigoPais {
    code: string;
    name: string;
    dialCode: string;
}

type TabKey = 'info' | 'colaboradores' | 'contactos' | 'grupos';

@Component({
    selector: 'app-detalle-proveedor',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, SidebarComponent, ConfirmationModalComponent],
    templateUrl: './detalle-proveedor.component.html',
    styleUrl: './detalle-proveedor.component.css'
})
export class DetalleProveedorComponent implements OnInit {
    // Sidebar
    sidebarCollapsed = false;
    sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

    // Datos del proveedor
    proveedorId: number | null = null;
    proveedor: ProveedorResponse | null = null;
    proveedorForm!: FormGroup;
    editandoProveedor = false;

    // Colaboradores
    colaboradores: ProveedorColaboradorResponse[] = [];
    colaboradorForm!: FormGroup;
    mostrarModalColaborador = false;
    editandoColaborador: ProveedorColaboradorResponse | null = null;

    // Contactos
    contactos: ProveedorContactoResponse[] = [];
    contactoForm!: FormGroup;
    mostrarModalContacto = false;
    editandoContacto: ProveedorContactoResponse | null = null;

    // Grupos de contacto
    gruposContacto: ProveedorGrupoContactoResponse[] = [];
    grupoContactoForm!: FormGroup;
    mostrarModalGrupoContacto = false;
    editandoGrupoContacto: ProveedorGrupoContactoResponse | null = null;

    // UI State
    activeTab: TabKey = 'info';
    isLoading = false;
    error: string | null = null;

    // Confirmation modal
    showConfirmation = false;
    confirmationConfig: ConfirmationConfig = {
        title: '',
        message: '',
        type: 'warning'
    };
    pendingAction: (() => void) | null = null;

    // Country codes
    codigosPaises: CodigoPais[] = [
        { code: 'AR', name: 'Argentina', dialCode: '+54' },
        { code: 'BO', name: 'Bolivia', dialCode: '+591' },
        { code: 'BR', name: 'Brasil', dialCode: '+55' },
        { code: 'CA', name: 'Canadá', dialCode: '+1' },
        { code: 'CL', name: 'Chile', dialCode: '+56' },
        { code: 'CO', name: 'Colombia', dialCode: '+57' },
        { code: 'CR', name: 'Costa Rica', dialCode: '+506' },
        { code: 'CU', name: 'Cuba', dialCode: '+53' },
        { code: 'EC', name: 'Ecuador', dialCode: '+593' },
        { code: 'SV', name: 'El Salvador', dialCode: '+503' },
        { code: 'ES', name: 'España', dialCode: '+34' },
        { code: 'US', name: 'Estados Unidos', dialCode: '+1' },
        { code: 'GT', name: 'Guatemala', dialCode: '+502' },
        { code: 'HN', name: 'Honduras', dialCode: '+504' },
        { code: 'MX', name: 'México', dialCode: '+52' },
        { code: 'NI', name: 'Nicaragua', dialCode: '+505' },
        { code: 'PA', name: 'Panamá', dialCode: '+507' },
        { code: 'PY', name: 'Paraguay', dialCode: '+595' },
        { code: 'PE', name: 'Perú', dialCode: '+51' },
        { code: 'DO', name: 'República Dominicana', dialCode: '+1-809' },
        { code: 'UY', name: 'Uruguay', dialCode: '+598' },
        { code: 'VE', name: 'Venezuela', dialCode: '+58' },
        { code: 'FR', name: 'Francia', dialCode: '+33' },
        { code: 'DE', name: 'Alemania', dialCode: '+49' },
        { code: 'IT', name: 'Italia', dialCode: '+39' },
        { code: 'GB', name: 'Reino Unido', dialCode: '+44' },
        { code: 'CN', name: 'China', dialCode: '+86' },
        { code: 'JP', name: 'Japón', dialCode: '+81' },
        { code: 'KR', name: 'Corea del Sur', dialCode: '+82' }
    ];

    // País filtering
    busquedaPais: string = '';
    paisesFiltrados: CodigoPais[] = [...this.codigosPaises];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private fb: FormBuilder,
        private proveedorService: ProveedorService,
        private colaboradorService: ProveedorColaboradorService,
        private contactoService: ProveedorContactoService,
        private grupoContactoService: ProveedorGrupoContactoService,
        private menuConfigService: MenuConfigService,
        private cdr: ChangeDetectorRef
    ) {
        this.initializeForms();
    }

    ngOnInit(): void {
        this.sidebarMenuItems = this.menuConfigService.getMenuItems('/proveedores');

        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.proveedorId = parseInt(id, 10);
                this.loadProveedor();
            }
        });
    }

    initializeForms(): void {
        this.proveedorForm = this.fb.group({
            nombre: ['', Validators.required],
            nombreJuridico: [''],
            ruc: [null]
        });

        this.colaboradorForm = this.fb.group({
            nombre: ['', Validators.required],
            cargo: [''],
            email: ['', [Validators.email]],
            telefono: [''],
            codigoPais: ['+51', Validators.required],
            detalle: ['']
        });

        this.contactoForm = this.fb.group({
            descripcion: [''],
            email: ['', [Validators.email]],
            numero: [''],
            codigoPais: ['+51', Validators.required],
            grupoContactoId: [null]
        });

        this.grupoContactoForm = this.fb.group({
            nombre: ['', Validators.required],
            descripcion: ['']
        });
    }

    // =================================================================
    // SIDEBAR
    // =================================================================
    onToggleSidebar(): void {
        this.sidebarCollapsed = !this.sidebarCollapsed;
    }

    onSidebarItemClick(item: ExtendedSidebarMenuItem): void {
        if (item.route) {
            this.router.navigate([item.route]);
        }
    }

    // =================================================================
    // LOAD DATA
    // =================================================================
    loadProveedor(): void {
        if (!this.proveedorId) return;

        this.isLoading = true;
        this.error = null;

        this.proveedorService.getByIdProveedor(this.proveedorId).subscribe({
            next: (data) => {
                this.proveedor = data;
                this.loadColaboradores();
                this.loadContactos();
                this.loadGruposContacto();
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading proveedor:', error);
                this.error = 'Error al cargar el proveedor';
                this.isLoading = false;
            }
        });
    }

    loadColaboradores(): void {
        if (!this.proveedorId) return;

        this.colaboradorService.getByProveedorId(this.proveedorId).subscribe({
            next: (data) => {
                this.colaboradores = data;
            },
            error: (error) => {
                console.error('Error loading colaboradores:', error);
            }
        });
    }

    loadContactos(): void {
        if (!this.proveedorId) return;

        this.contactoService.getByProveedorId(this.proveedorId).subscribe({
            next: (data) => {
                this.contactos = data;
            },
            error: (error) => {
                console.error('Error loading contactos:', error);
            }
        });
    }

    loadGruposContacto(): void {
        this.grupoContactoService.findAll().subscribe({
            next: (data) => {
                this.gruposContacto = data;
            },
            error: (error) => {
                console.error('Error loading grupos contacto:', error);
            }
        });
    }

    // =================================================================
    // TAB NAVIGATION
    // =================================================================
    setActiveTab(tab: string): void {
        this.activeTab = tab as TabKey;
    }

    // =================================================================
    // COLABORADORES CRUD
    // =================================================================
    abrirModalColaborador(colaborador?: ProveedorColaboradorResponse): void {
        if (colaborador) {
            this.editandoColaborador = colaborador;
            this.colaboradorForm.patchValue({
                nombre: colaborador.nombre,
                cargo: colaborador.cargo,
                email: colaborador.email,
                telefono: colaborador.telefono,
                detalle: colaborador.detalle
            });
        } else {
            this.editandoColaborador = null;
            this.colaboradorForm.reset();
        }
        this.mostrarModalColaborador = true;
    }

    cerrarModalColaborador(): void {
        this.mostrarModalColaborador = false;
        this.editandoColaborador = null;
        this.colaboradorForm.reset();
    }

    guardarColaborador(): void {
        if (this.colaboradorForm.invalid || !this.proveedorId) return;

        const request: ProveedorColaboradorRequest = {
            ...this.colaboradorForm.value,
            proveedorId: this.proveedorId
        };

        if (this.editandoColaborador) {
            this.colaboradorService.update(this.editandoColaborador.id, request).subscribe({
                next: () => {
                    this.loadColaboradores();
                    this.cerrarModalColaborador();
                },
                error: (error) => console.error('Error updating colaborador:', error)
            });
        } else {
            this.colaboradorService.create(request).subscribe({
                next: () => {
                    this.loadColaboradores();
                    this.cerrarModalColaborador();
                },
                error: (error) => console.error('Error creating colaborador:', error)
            });
        }
    }

    eliminarColaborador(colaborador: ProveedorColaboradorResponse): void {
        if (confirm(`¿Eliminar colaborador ${colaborador.nombre}?`)) {
            this.colaboradorService.delete(colaborador.id).subscribe({
                next: () => this.loadColaboradores(),
                error: (error) => console.error('Error deleting colaborador:', error)
            });
        }
    }

    // =================================================================
    // CONTACTOS CRUD
    // =================================================================
    abrirModalContacto(contacto?: ProveedorContactoResponse): void {
        if (contacto) {
            this.editandoContacto = contacto;
            this.contactoForm.patchValue({
                descripcion: contacto.descripcion,
                email: contacto.email,
                numero: contacto.numero,
                grupoContactoId: contacto.grupoContactoId
            });
        } else {
            this.editandoContacto = null;
            this.contactoForm.reset();
        }
        this.mostrarModalContacto = true;
    }

    cerrarModalContacto(): void {
        this.mostrarModalContacto = false;
        this.editandoContacto = null;
        this.contactoForm.reset();
    }

    guardarContacto(): void {
        if (!this.proveedorId) return;

        const request: ProveedorContactoRequest = {
            ...this.contactoForm.value,
            proveedorId: this.proveedorId
        };

        if (this.editandoContacto) {
            this.contactoService.update(this.editandoContacto.id, request).subscribe({
                next: () => {
                    this.loadContactos();
                    this.cerrarModalContacto();
                },
                error: (error) => console.error('Error updating contacto:', error)
            });
        } else {
            this.contactoService.create(request).subscribe({
                next: () => {
                    this.loadContactos();
                    this.cerrarModalContacto();
                },
                error: (error) => console.error('Error creating contacto:', error)
            });
        }
    }

    eliminarContacto(contacto: ProveedorContactoResponse): void {
        if (confirm(`¿Eliminar contacto ${contacto.email || contacto.numero}?`)) {
            this.contactoService.delete(contacto.id).subscribe({
                next: () => this.loadContactos(),
                error: (error) => console.error('Error deleting contacto:', error)
            });
        }
    }

    // =================================================================
    // GRUPOS CONTACTO CRUD
    // =================================================================
    abrirModalGrupoContacto(grupo?: ProveedorGrupoContactoResponse): void {
        if (grupo) {
            this.editandoGrupoContacto = grupo;
            this.grupoContactoForm.patchValue({
                nombre: grupo.nombre,
                descripcion: grupo.descripcion
            });
        } else {
            this.editandoGrupoContacto = null;
            this.grupoContactoForm.reset();
        }
        this.mostrarModalGrupoContacto = true;
    }

    cerrarModalGrupoContacto(): void {
        this.mostrarModalGrupoContacto = false;
        this.editandoGrupoContacto = null;
        this.grupoContactoForm.reset();
    }

    guardarGrupoContacto(): void {
        if (this.grupoContactoForm.invalid) return;

        const request: ProveedorGrupoContactoRequest = this.grupoContactoForm.value;

        if (this.editandoGrupoContacto) {
            this.grupoContactoService.update(this.editandoGrupoContacto.id, request).subscribe({
                next: () => {
                    this.loadGruposContacto();
                    this.cerrarModalGrupoContacto();
                },
                error: (error) => console.error('Error updating grupo:', error)
            });
        } else {
            this.grupoContactoService.create(request).subscribe({
                next: () => {
                    this.loadGruposContacto();
                    this.cerrarModalGrupoContacto();
                },
                error: (error) => console.error('Error creating grupo:', error)
            });
        }
    }

    eliminarGrupoContacto(grupo: ProveedorGrupoContactoResponse): void {
        if (confirm(`¿Eliminar grupo ${grupo.nombre}?`)) {
            this.grupoContactoService.delete(grupo.id).subscribe({
                next: () => this.loadGruposContacto(),
                error: (error) => console.error('Error deleting grupo:', error)
            });
        }
    }

    // =================================================================
    // PROVEEDOR EDIT
    // =================================================================
    activarEdicionProveedor(): void {
        this.editandoProveedor = true;
        if (this.proveedor) {
            this.proveedorForm.patchValue({
                nombre: this.proveedor.nombre,
                nombreJuridico: this.proveedor.nombreJuridico || '',
                ruc: this.proveedor.ruc || null
            });
        }
    }

    cancelarEdicionProveedor(): void {
        this.editandoProveedor = false;
        this.proveedorForm.reset();
    }

    guardarProveedor(): void {
        if (this.proveedorForm.invalid || !this.proveedorId) {
            console.log('Form invalid or no proveedorId', {
                formValid: this.proveedorForm.valid,
                formValue: this.proveedorForm.value,
                proveedorId: this.proveedorId
            });
            return;
        }

        const request: ProveedorRequest = this.proveedorForm.value;
        console.log('Guardando proveedor:', request);

        this.proveedorService.updateProveedor(this.proveedorId, request).subscribe({
            next: (response) => {
                console.log('Proveedor actualizado exitosamente:', response);
                this.loadProveedor();
                this.editandoProveedor = false;
                this.cdr.detectChanges();
                this.mostrarMensajeExito('Proveedor actualizado correctamente');
            },
            error: (error) => {
                console.error('Error updating proveedor:', error);
                this.mostrarMensajeError('Error al actualizar el proveedor', error.error?.message || error.message);
            }
        });
    }

    // =================================================================
    // CONFIRMATION MODAL METHODS
    // =================================================================
    onConfirmAction(): void {
        if (this.pendingAction) {
            this.pendingAction();
            this.pendingAction = null;
        }
        this.showConfirmation = false;
    }

    onCancelAction(): void {
        this.pendingAction = null;
        this.showConfirmation = false;
    }

    mostrarConfirmacion(title: string, message: string, action: () => void, type: 'warning' | 'danger' = 'warning'): void {
        this.confirmationConfig = { title, message, type };
        this.pendingAction = action;
        this.showConfirmation = true;
    }

    mostrarMensajeExito(mensaje: string): void {
        this.confirmationConfig = {
            title: '✓ Éxito',
            message: mensaje,
            type: 'success',
            confirmText: 'OK',
            cancelText: ''
        };
        this.showConfirmation = true;
        setTimeout(() => this.showConfirmation = false, 2000);
    }

    mostrarMensajeError(titulo: string, mensaje: string): void {
        this.confirmationConfig = {
            title: titulo,
            message: mensaje,
            type: 'danger',
            confirmText: 'OK'
        };
        this.showConfirmation = true;
    }

    getPaisNombre(dialCode: string): string {
        const pais = this.codigosPaises.find(p => p.dialCode === dialCode);
        return pais ? pais.name : dialCode;
    }

    getTelefonoCompleto(contacto: ProveedorContactoResponse): string {
        if (contacto.codigoPais && contacto.numero) {
            return `${contacto.codigoPais} ${contacto.numero}`;
        }
        return contacto.numero || '';
    }

    // =================================================================
    // PAÍS FILTERING METHODS
    // =================================================================
    filtrarPaises(busqueda: string): void {
        this.busquedaPais = busqueda.toLowerCase();
        if (!this.busquedaPais) {
            this.paisesFiltrados = [...this.codigosPaises];
            return;
        }

        this.paisesFiltrados = this.codigosPaises.filter(pais =>
            pais.name.toLowerCase().includes(this.busquedaPais) ||
            pais.dialCode.includes(this.busquedaPais) ||
            pais.code.toLowerCase().includes(this.busquedaPais)
        );
    }

    seleccionarPaisContacto(dialCode: string): void {
        this.contactoForm.patchValue({ codigoPais: dialCode });
        this.busquedaPais = '';
        this.paisesFiltrados = [...this.codigosPaises];
    }

    seleccionarPaisColaborador(dialCode: string): void {
        this.colaboradorForm.patchValue({ codigoPais: dialCode });
        this.busquedaPais = '';
        this.paisesFiltrados = [...this.codigosPaises];
    }

    // =================================================================
    // NAVIGATION
    // =================================================================
    volverAProveedores(): void {
        this.router.navigate(['/proveedores']);
    }
}
