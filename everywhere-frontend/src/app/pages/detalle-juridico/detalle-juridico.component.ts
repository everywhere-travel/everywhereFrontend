import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, Observable, of, forkJoin } from 'rxjs';
import { catchError, finalize, tap, switchMap } from 'rxjs/operators';

// Services
import { LoadingService } from '../../core/service/loading.service';
import { AuthorizationService } from '../../core/service/authorization.service';
import { PersonaNaturalService } from '../../core/service/natural/persona-natural.service';
import { PersonaJuridicaService } from '../../core/service/juridica/persona-juridica.service';
import { PersonaService } from '../../core/service/persona/persona.service';
import { ViajeroService } from '../../core/service/viajero/viajero.service';
import { ViajeroFrecuenteService } from '../../core/service';
import { NaturalJuridicoService } from '../../core/service/NaturalJuridico/natural-juridico.service';
import { DocumentoService } from '../../core/service/Documento/documento.service';
import { DetalleDocumentoService } from '../../core/service/DetalleDocumento/detalle-documento.service';
import { CorreoPersonaService } from '../../core/service/CorreoPersona/correo-persona.service';
import { TelefonoPersonaService } from '../../core/service/TelefonoPersona/telefono-persona.service';

// Models
import { PersonaNaturalResponse, PersonaNaturalRequest, PersonaNaturalViajero, PersonaNaturalCategoria, PersonaNaturalSinViajero } from '../../shared/models/Persona/personaNatural.model';
import { PersonaJuridicaResponse, PersonaJuridicaRequest } from '../../shared/models/Persona/personaJuridica.models';
import { PersonaResponse, PersonaRequest, personaDisplay } from '../../shared/models/Persona/persona.model';
import { CorreoPersonaResponse, CorreoPersonaRequest } from '../../shared/models/CorreoPersona/correoPersona.model';
import { TelefonoPersonaResponse, TelefonoPersonaRequest } from '../../shared/models/TelefonoPersona/telefonoPersona.models';
import { NaturalJuridicaResponse, NaturalJuridicaRequest, NaturalJuridicoPatch } from '../../shared/models/NaturalJuridica/naturalJuridica.models';

// Components
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';

// Interfaces
interface ExtendedSidebarMenuItem extends SidebarMenuItem {
  moduleKey?: string;
  children?: ExtendedSidebarMenuItem[];
}

interface CodigoPais {
  code: string;
  name: string;
  dialCode: string;
}

function atLeastOneRequired(fieldNames: string[]) {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const form = formGroup as FormGroup;
    const hasValue = fieldNames.some(fieldName => {
      const control = form.get(fieldName);
      return control && control.value && control.value.trim().length > 0;
    });

    return hasValue ? null : { atLeastOneRequired: true };
  };
}

@Component({
  selector: 'app-detalle-juridico',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './detalle-juridico.component.html',
  styleUrls: ['./detalle-juridico.component.css']
})
export class DetalleJuridicoComponent implements OnInit, OnDestroy {

  // Services injection
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private loadingService = inject(LoadingService);
  private authService = inject(AuthorizationService);
  private personaService = inject(PersonaService);
  private personaNaturalService = inject(PersonaNaturalService);
  private personaJuridicaService = inject(PersonaJuridicaService);
  private viajeroService = inject(ViajeroService);
  private viajeroFrecuenteService = inject(ViajeroFrecuenteService);
  private naturalJuridicoService = inject(NaturalJuridicoService);
  private documentoService = inject(DocumentoService);
  private detalleDocumentoService = inject(DetalleDocumentoService);
  private correoPersonaService = inject(CorreoPersonaService);
  private telefonoPersonaService = inject(TelefonoPersonaService);
  private fb = inject(FormBuilder);

  // Data properties
  personaId: number | null = null;
  personaJuridica: PersonaJuridicaResponse | null = null;
  clientesAsociados: PersonaNaturalResponse[] = [];
  telefonos: TelefonoPersonaResponse[] = [];
  correos: CorreoPersonaResponse[] = [];
  personaJuridicaForm!: FormGroup;
  showPersonaJuridicaModal = false;
  isCreating: boolean = false;

  codigosPaises: CodigoPais[] = [
    { code: 'PE', name: 'Perú', dialCode: '+51' },
    { code: 'US', name: 'Estados Unidos', dialCode: '+1' },
    { code: 'MX', name: 'México', dialCode: '+52' },
    { code: 'CO', name: 'Colombia', dialCode: '+57' },
    { code: 'AR', name: 'Argentina', dialCode: '+54' },
    { code: 'CL', name: 'Chile', dialCode: '+56' },
    { code: 'EC', name: 'Ecuador', dialCode: '+593' },
    { code: 'BO', name: 'Bolivia', dialCode: '+591' },
    { code: 'VE', name: 'Venezuela', dialCode: '+58' },
    { code: 'BR', name: 'Brasil', dialCode: '+55' },
    { code: 'PY', name: 'Paraguay', dialCode: '+595' },
    { code: 'UY', name: 'Uruguay', dialCode: '+598' },
    { code: 'PA', name: 'Panamá', dialCode: '+507' },
    { code: 'CR', name: 'Costa Rica', dialCode: '+506' },
    { code: 'ES', name: 'España', dialCode: '+34' },
    { code: 'GB', name: 'Reino Unido', dialCode: '+44' },
    { code: 'FR', name: 'Francia', dialCode: '+33' },
    { code: 'DE', name: 'Alemania', dialCode: '+49' },
    { code: 'IT', name: 'Italia', dialCode: '+39' },
    { code: 'CN', name: 'China', dialCode: '+86' },
    { code: 'JP', name: 'Japón', dialCode: '+81' },
    { code: 'KR', name: 'Corea del Sur', dialCode: '+82' },
    { code: 'AU', name: 'Australia', dialCode: '+61' },
    { code: 'CA', name: 'Canadá', dialCode: '+1' }
  ];

  tiposTelefono = [
    { value: 'PRINCIPAL', label: 'Principal' },
    { value: 'SECUNDARIO', label: 'Secundario' }
  ];

  tiposCorreo = [
    { value: 'PRINCIPAL', label: 'Principal' },
    { value: 'SECUNDARIO', label: 'Secundario' }
  ];

  // UI State
  isLoading = false;
  error: string | null = null;
  sidebarCollapsed = false;
  activeTab: 'info' | 'clientes' | 'contacto' = 'info';

  // Forms
  telefonoForm!: FormGroup;
  correoForm!: FormGroup;
  clienteForm!: FormGroup;

  // Modal states
  showTelefonoModal = false;
  showCorreoModal = false;
  showClienteModal = false;
  editingTelefonoId: number | null = null;
  editingCorreoId: number | null = null;

  // Sidebar Configuration
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];
  allSidebarMenuItems: ExtendedSidebarMenuItem[] = [
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
      route: '/documentos-cobranza',
      moduleKey: 'DOCUMENTOS_COBRANZA'
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
          moduleKey: 'OPERADORES'
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

  private subscriptions = new Subscription();

  constructor() {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.initializeSidebar();
    this.loadPersonaFromRoute();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeForms(): void {
    this.personaJuridicaForm = this.fb.group({
      ruc: [''],
      razonSocial: [''],
      direccion: [''],
      observacion: [''],
    },{
      validators: atLeastOneRequired(['ruc', 'razonSocial'])
    });

    this.telefonoForm = this.fb.group({
      numero: [''],
      codigoPais: ['+51', [Validators.required]],
      tipo: ['PRINCIPAL', [Validators.required]],
      descripcion: ['']
    });

    this.correoForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      tipo: ['PRINCIPAL', [Validators.required]]
    });

    this.clienteForm = this.fb.group({
      clienteIds: [[], [Validators.required]]
    });
  }

  private loadPersonaFromRoute(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam === 'nuevo') {
      this.isCreating = true;
      this.personaId = null;
      this.isLoading = false;
      this.personaJuridicaForm.reset();
      return;
    }

    if (!idParam || isNaN(Number(idParam))) {
      this.error = 'ID de persona inválido';
      return;
    }

    this.personaId = Number(idParam);
    this.loadPersonaData();
  }

  private loadPersonaData(): void {
    if (!this.personaId) return;

    this.isLoading = true;
    this.loadingService.setLoading(true);

    // Cargar todos los datos en paralelo
    const dataLoaders$ = forkJoin({
      personaJuridica: this.personaJuridicaService.findById(this.personaId),
      clientesAsociados: this.naturalJuridicoService.findByPersonaJuridicaId(this.personaId),
      telefonos: this.telefonoPersonaService.findByPersonaId(this.personaId),
      correos: this.correoPersonaService.findByPersonaId(this.personaId),
    });

    const subscription = dataLoaders$
      .pipe(
        tap(data => {
          this.personaJuridica = data.personaJuridica;
          this.clientesAsociados = this.extractClientesAsociados(data.clientesAsociados);
          this.telefonos = data.telefonos;
          this.correos = data.correos;
        }),
        catchError(error => {
          this.error = 'Error al cargar los datos de la persona';
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
          this.loadingService.setLoading(false);
        })
      )
      .subscribe();

    this.subscriptions.add(subscription);
  }

  private extractClientesAsociados(naturalJuridicaResponses: NaturalJuridicaResponse[]): PersonaNaturalResponse[] {
    const clientes: PersonaNaturalResponse[] = [];

    naturalJuridicaResponses.forEach(njResponse => {
      if (njResponse.personaNatural) {
        clientes.push(njResponse.personaNatural);
      }
    });

    return clientes;
  }

  private modoCrear(): void {
    this.isCreating = true;
    this.personaId = null;
    this.isLoading = false;

    // Inicializar formularios vacíos
    this.personaJuridicaForm.reset();

  }

  // Navigation methods
  volverAPersonas(): void {
    this.router.navigate(['/personas']);
  }

  // Tab management
  setActiveTab(tab: 'info' | 'clientes' | 'contacto'): void {
    this.activeTab = tab;
  }

  setActiveTabFromString(tab: string): void {
    this.setActiveTab(tab as 'info' | 'clientes' | 'contacto');
  }

  // Sidebar methods
  private initializeSidebar(): void {
    this.sidebarMenuItems = this.filterSidebarItems(this.allSidebarMenuItems);
  }

  private filterSidebarItems(items: ExtendedSidebarMenuItem[]): ExtendedSidebarMenuItem[] {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return items;

    const currentRole = this.authService.getCurrentRole();
    if (this.authService.isAdmin() || !currentRole) return items;

    return items.filter(item => {
      if (!item.moduleKey) return true; // Filtrar por permisos según sea necesario
      return true;
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

  // Utility methods
  getEmpresaNombre(): string {
    if (!this.personaJuridica) return '';
    return `${this.personaJuridica.razonSocial || ''}`.trim();
  }

  getTelefonoCompleto(telefono: TelefonoPersonaResponse): string {
    return `${telefono.codigoPais} ${telefono.numero}`;
  }

  getPaisNombre(dialCode: string): string {
    const pais = this.codigosPaises.find(p => p.dialCode === dialCode);
    return pais ? pais.name : dialCode;
  }

  getTipoTelefonoLabel(tipo: string): string {
    const tipoObj = this.tiposTelefono.find(t => t.value === tipo);
    return tipoObj ? tipoObj.label : tipo;
  }

  getTipoCorreoLabel(tipo: string): string {
    const tipoObj = this.tiposCorreo.find(t => t.value === tipo);
    return tipoObj ? tipoObj.label : tipo;
  }

  crearPersonaJuridica(): void {
    if (!this.personaJuridicaForm.valid) {
      this.markFormGroupTouched(this.personaJuridicaForm);
      return;
    }

    this.loadingService.setLoading(true);

    const formValue = this.personaJuridicaForm.value;
    const personaJuridicaData: PersonaJuridicaRequest = {
      ruc: formValue.ruc,
      razonSocial: formValue.razonSocial,
      persona: {
        direccion: formValue.direccion,
        observacion: formValue.observacion
      }
    };

    const subscription = this.personaJuridicaService.save(personaJuridicaData)
      .pipe(
        tap((response) => {
          // Cambiar de modo crear a modo detalle/editar
          this.isCreating = false;
          this.personaId = response.id;

          // Actualizar la URL sin recargar el componente
          this.router.navigate(['/juridico/detalle', response.id], { replaceUrl: true });

          // Cargar los datos de la persona recién creada
          this.loadPersonaData();
        }),
        catchError(error => {
          console.error('Error al crear empresa:', error);
          this.error = 'Error al crear la empresa. Por favor intente nuevamente.';
          return of(null);
        }),
        finalize(() => {
          this.loadingService.setLoading(false);
        })
      )
      .subscribe();

    this.subscriptions.add(subscription);
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

  // Informacion general management
  abrirModalPersonaNatural(): void {
    if (!this.personaJuridica) return;

    this.personaJuridicaForm.patchValue({
      ruc: this.personaJuridica.ruc || '',
      razonSocial: this.personaJuridica.razonSocial || '',
      direccion: this.personaJuridica.persona?.direccion || '',
      observacion: this.personaJuridica.persona?.observacion || '',
    });

    this.showPersonaJuridicaModal = true;
  }

  cerrarModalPersonaJuridica(): void {
    this.showPersonaJuridicaModal = false;
    this.personaJuridicaForm.reset();
  }

  guardarPersonaJuridica(): void {
    if (!this.personaJuridicaForm.valid || !this.personaId) return;

    this.loadingService.setLoading(true);

    const formValue = this.personaJuridicaForm.value;

    // Preparar datos de persona juridica
    const personaJuridicaData: PersonaJuridicaRequest = {
      ruc: formValue.ruc,
      razonSocial: formValue.razonSocial,
      persona: {
        direccion: formValue.direccion,
        observacion: formValue.observacion
      }
    };

    // Actualizar persona juridica
    const updatePersonaJuridica$ = this.personaJuridicaService.update(this.personaId, personaJuridicaData);

    // Ejecutar las operaciones
    const subscription = forkJoin({
      per: updatePersonaJuridica$,
    })
      .pipe(
        tap(() => {
          this.loadPersonaData();
          this.cerrarModalPersonaJuridica();
        }),
        catchError(error => {
          console.error('Error al actualizar:', error);
          this.error = 'Error al actualizar la información';
          return of(null);
        }),
        finalize(() => {
          this.loadingService.setLoading(false);
        })
      )
      .subscribe();

    this.subscriptions.add(subscription);
  }

  // Teléfonos management
  abrirModalTelefono(telefono?: TelefonoPersonaResponse): void {
    this.editingTelefonoId = telefono?.id || null;

    if (telefono) {
      this.telefonoForm.patchValue({
        numero: telefono.numero,
        codigoPais: telefono.codigoPais,
        tipo: telefono.tipo,
        descripcion: telefono.descripcion || ''
      });
    } else {
      this.telefonoForm.reset({
        codigoPais: '+51',
        tipo: 'PRINCIPAL'
      });
    }

    this.showTelefonoModal = true;
  }

  cerrarModalTelefono(): void {
    this.showTelefonoModal = false;
    this.editingTelefonoId = null;
    this.telefonoForm.reset({
      codigoPais: '+51',
      tipo: 'PRINCIPAL'
    });
  }

  guardarTelefono(): void {
    if (!this.telefonoForm.valid || !this.personaId) return;

    const telefonoData: TelefonoPersonaRequest = this.telefonoForm.value;

    let operation$: Observable<TelefonoPersonaResponse>;

    if (this.editingTelefonoId) {
      operation$ = this.telefonoPersonaService.update(this.personaId, this.editingTelefonoId, telefonoData);
    } else {
      operation$ = this.telefonoPersonaService.create(this.personaId, telefonoData);
    }

    const subscription = operation$
      .pipe(
        tap(() => {
          this.loadTelefonos();
          this.cerrarModalTelefono();
        }),
        catchError(error => {
          this.error = 'Error al guardar el teléfono';
          return of(null);
        })
      )
      .subscribe();

    this.subscriptions.add(subscription);
  }

  eliminarTelefono(telefono: TelefonoPersonaResponse): void {
    if (!this.personaId || !confirm('¿Está seguro de eliminar este teléfono?')) return;

    const subscription = this.telefonoPersonaService.delete(this.personaId, telefono.id)
      .pipe(
        tap(() => this.loadTelefonos()),
        catchError(error => {
          this.error = 'Error al eliminar el teléfono';
          return of(null);
        })
      )
      .subscribe();

    this.subscriptions.add(subscription);
  }

  private loadTelefonos(): void {
    if (!this.personaId) return;

    const subscription = this.telefonoPersonaService.findByPersonaId(this.personaId)
      .subscribe(telefonos => {
        this.telefonos = telefonos;
      });

    this.subscriptions.add(subscription);
  }

  // Correos management
  abrirModalCorreo(correo?: CorreoPersonaResponse): void {
    this.editingCorreoId = correo?.id || null;

    if (correo) {
      this.correoForm.patchValue({
        email: correo.email,
        tipo: correo.tipo
      });
    } else {
      this.correoForm.reset({
        tipo: 'PRINCIPAL'
      });
    }

    this.showCorreoModal = true;
  }

  cerrarModalCorreo(): void {
    this.showCorreoModal = false;
    this.editingCorreoId = null;
    this.correoForm.reset({
      tipo: 'PRINCIPAL'
    });
  }

  guardarCorreo(): void {
    if (!this.correoForm.valid || !this.personaId) return;

    const correoData: CorreoPersonaRequest = this.correoForm.value;

    let operation$: Observable<CorreoPersonaResponse>;

    if (this.editingCorreoId) {
      operation$ = this.correoPersonaService.update(this.personaId, this.editingCorreoId, correoData);
    } else {
      operation$ = this.correoPersonaService.create(this.personaId, correoData);
    }

    const subscription = operation$
      .pipe(
        tap(() => {
          this.loadCorreos();
          this.cerrarModalCorreo();
        }),
        catchError(error => {
          this.error = 'Error al guardar el correo';
          return of(null);
        })
      )
      .subscribe();

    this.subscriptions.add(subscription);
  }

  eliminarCorreo(correo: CorreoPersonaResponse): void {
    if (!confirm('¿Está seguro de eliminar este correo?')) return;

    const subscription = this.correoPersonaService.delete(correo.id)
      .pipe(
        tap(() => this.loadCorreos()),
        catchError(error => {
          this.error = 'Error al eliminar el correo';
          return of(null);
        })
      )
      .subscribe();

    this.subscriptions.add(subscription);
  }

  private loadCorreos(): void {
    if (!this.personaId) return;

    const subscription = this.correoPersonaService.findByPersonaId(this.personaId)
      .subscribe(correos => {
        this.correos = correos;
      });

    this.subscriptions.add(subscription);
  }

  // Clientes management
  abrirModalCliente(): void {
    this.showClienteModal = true;
  }

  cerrarModalCliente(): void {
    this.showClienteModal = false;
    this.clienteForm.reset({ empresaIds: [] });
    this.error = null;
  }

  private recargarClientesAsociados(): void {
    if (!this.personaId) return;

    const subscription = this.naturalJuridicoService.findByPersonaJuridicaId(this.personaId)
      .pipe(
        tap(result => {
          this.clientesAsociados = this.extractClientesAsociados(result);
        }),
        catchError(error => {
          return of([]);
        })
      )
      .subscribe();

    this.subscriptions.add(subscription);
  }
}
