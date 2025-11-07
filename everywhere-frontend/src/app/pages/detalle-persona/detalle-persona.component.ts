import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { CategoriaPersonaService } from '../../core/service/CategoriaPersona/categoria-persona.service';

// Models
import { PersonaNaturalResponse, PersonaNaturalRequest } from '../../shared/models/Persona/personaNatural.model';
import { PersonaJuridicaResponse } from '../../shared/models/Persona/personaJuridica.models';
import { ViajeroResponse, ViajeroRequest } from '../../shared/models/Viajero/viajero.model';
import { ViajeroFrecuenteResponse, ViajeroFrecuenteRequest } from '../../shared/models/Viajero/viajeroFrecuente.model';
import { DocumentoResponse } from '../../shared/models/Documento/documento.model';
import { DetalleDocumentoResponse, DetalleDocumentoRequest } from '../../shared/models/Documento/detalleDocumento.model';
import { CorreoPersonaResponse, CorreoPersonaRequest } from '../../shared/models/CorreoPersona/correoPersona.model';
import { TelefonoPersonaResponse, TelefonoPersonaRequest } from '../../shared/models/TelefonoPersona/telefonoPersona.models';
import { NaturalJuridicaResponse, NaturalJuridicaRequest } from '../../shared/models/NaturalJuridica/naturalJuridica.models';
import { CategoriaPersonaResponse } from '../../shared/models/CategoriaPersona/categoriaPersona.models';

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

@Component({
  selector: 'app-detalle-persona',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './detalle-persona.component.html',
  styleUrls: ['./detalle-persona.component.css']
})
export class DetallePersonaComponent implements OnInit, OnDestroy {

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
  private categoriaPersonaService = inject(CategoriaPersonaService);
  private fb = inject(FormBuilder);

  // Data properties
  personaId: number | null = null;
  personaNatural: PersonaNaturalResponse | null = null;
  empresasAsociadas: PersonaJuridicaResponse[] = [];
  telefonos: TelefonoPersonaResponse[] = [];
  correos: CorreoPersonaResponse[] = [];
  documentos: DetalleDocumentoResponse[] = [];
  viajerosFrecuentes: ViajeroFrecuenteResponse[] = [];
  todasLasEmpresas: PersonaJuridicaResponse[] = [];
  tiposDocumento: DocumentoResponse[] = [];
  categoriasPersona: CategoriaPersonaResponse[] = [];
  documentoForm!: FormGroup;
  showDocumentoModal = false;
  editingDocumentoId: number | null = null;
  personaNaturalForm!: FormGroup;
  showPersonaNaturalModal = false;
  editingViajeroFrecuenteId: number | null = null;
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
  activeTab: 'info' | 'empresas' | 'contacto' | 'documentos' | 'viajeros' = 'info';

  // Forms
  telefonoForm!: FormGroup;
  correoForm!: FormGroup;
  empresaForm!: FormGroup;
  viajeroFrecuenteForm!: FormGroup;

  // Modal states
  showTelefonoModal = false;
  showCorreoModal = false;
  showEmpresaModal = false;
  showViajeroFrecuenteModal = false;
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
    this.personaNaturalForm = this.fb.group({
      documento: [''],
      nombres: ['', [Validators.required]],
      apellidosPaterno: ['', [Validators.required]],
      apellidosMaterno: [''],
      sexo: [''],
      direccion: [''],
      observacion: [''],
      fechaNacimiento: [''],
      nacionalidad: [''],
      residencia: [''],
      categoriaPersonaId: [null]
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

    this.empresaForm = this.fb.group({
      empresaIds: [[], [Validators.required]]
    });

    this.viajeroFrecuenteForm = this.fb.group({
      areolinea: ['', [Validators.required]],
      codigo: ['', [Validators.required]]
    });

    this.documentoForm = this.fb.group({
      numero: ['', [Validators.required]],
      fechaEmision: [''],
      fechaVencimiento: [''],
      origen: ['', [Validators.required]],
      documentoId: [null, [Validators.required]]
    });
  }

  private loadPersonaFromRoute(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam === 'nuevo') {
      this.isCreating = true;
      this.personaId = null;
      this.isLoading = false;
      this.personaNaturalForm.reset();
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
      personaNatural: this.personaNaturalService.findById(this.personaId),
      empresasAsociadas: this.naturalJuridicoService.findByPersonaNaturalId(this.personaId),
      telefonos: this.telefonoPersonaService.findByPersonaId(this.personaId),
      correos: this.correoPersonaService.findByPersonaId(this.personaId),
      documentos: this.detalleDocumentoService.findByPersonaNaturalId(this.personaId),
      todasLasEmpresas: this.personaJuridicaService.findAll(),
      tiposDocumento: this.documentoService.getAllDocumentos(),
      categoriasPersona: this.categoriaPersonaService.findAll()
    });

    const subscription = dataLoaders$
      .pipe(
        tap(data => {
          this.personaNatural = data.personaNatural;
          this.empresasAsociadas = this.extractEmpresasAsociadas(data.empresasAsociadas);
          this.telefonos = data.telefonos;
          this.correos = data.correos;
          this.documentos = data.documentos;
          this.todasLasEmpresas = data.todasLasEmpresas;
          this.tiposDocumento = data.tiposDocumento;
          this.categoriasPersona = data.categoriasPersona;

          // Cargar viajeros frecuentes si la persona tiene viajero asociado
          if (this.personaNatural?.viajero) {
            this.loadViajerosFrecuentes(this.personaNatural.viajero.id);
          }
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

  private extractEmpresasAsociadas(naturalJuridicaResponses: NaturalJuridicaResponse[]): PersonaJuridicaResponse[] {
    const empresas: PersonaJuridicaResponse[] = [];

    naturalJuridicaResponses.forEach(njResponse => {
      if (njResponse.personaJuridica) {
        empresas.push(njResponse.personaJuridica);
      }
    });

    return empresas;
  }

  private loadViajerosFrecuentes(viajeroId: number): void {
    const subscription = this.viajeroFrecuenteService.listarPorViajero(viajeroId)
      .pipe(
        catchError(() => of([]))
      )
      .subscribe((viajeros: ViajeroFrecuenteResponse[]) => {
        this.viajerosFrecuentes = viajeros;
      });

    this.subscriptions.add(subscription);
  }

  private modoCrear(): void {
    this.isCreating = true;
    this.personaId = null;
    this.isLoading = false;

    // Inicializar formularios vacíos
    this.personaNaturalForm.reset();

    // Cargar datos necesarios para la creación
    this.loadDatosParaCreacion();
  }

  private loadDatosParaCreacion(): void {
    this.loadingService.setLoading(true);

    const subscription = forkJoin({
      empresas: this.personaJuridicaService.findAll(),
      tiposDocumento: this.documentoService.getAllDocumentos(),
      categoriasPersona: this.categoriaPersonaService.findAll()
    })
      .pipe(
        tap(data => {
          this.todasLasEmpresas = data.empresas;
          this.tiposDocumento = data.tiposDocumento;
          this.categoriasPersona = data.categoriasPersona;
        }),
        catchError(error => {
          this.error = 'Error al cargar datos iniciales';
          return of(null);
        }),
        finalize(() => {
          this.loadingService.setLoading(false);
        })
      )
      .subscribe();

    this.subscriptions.add(subscription);
  }

  // Navigation methods
  volverAPersonas(): void {
    this.router.navigate(['/personas']);
  }

  // Tab management
  setActiveTab(tab: 'info' | 'empresas' | 'contacto' | 'documentos' | 'viajeros'): void {
    this.activeTab = tab;
  }

  setActiveTabFromString(tab: string): void {
    this.setActiveTab(tab as 'info' | 'empresas' | 'contacto' | 'documentos' | 'viajeros');
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
  getPersonaNombre(): string {
    if (!this.personaNatural) return '';
    return `${this.personaNatural.nombres || ''} ${this.personaNatural.apellidosPaterno || ''} ${this.personaNatural.apellidosMaterno || ''}`.trim();
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

  crearPersonaNatural(): void {
    if (!this.personaNaturalForm.valid) {
      this.markFormGroupTouched(this.personaNaturalForm);
      return;
    }

    this.loadingService.setLoading(true);

    const formValue = this.personaNaturalForm.value;
    const personaNaturalData: PersonaNaturalRequest = {
      documento: formValue.documento,
      nombres: formValue.nombres,
      apellidosPaterno: formValue.apellidosPaterno,
      apellidosMaterno: formValue.apellidosMaterno,
      sexo: formValue.sexo,
      categoriaPersonaId: formValue.categoriaPersonaId || undefined,
      persona: {
        direccion: formValue.direccion,
        observacion: formValue.observacion
      }
    };

    const subscription = this.personaNaturalService.save(personaNaturalData)
      .pipe(
        tap((response) => {
          // Cambiar de modo crear a modo detalle/editar
          this.isCreating = false;
          this.personaId = response.id;

          // Actualizar la URL sin recargar el componente
          this.router.navigate(['/personas/detalle', response.id], { replaceUrl: true });

          // Cargar los datos de la persona recién creada
          this.loadPersonaData();
        }),
        catchError(error => {
          console.error('Error al crear cliente:', error);
          this.error = 'Error al crear el cliente. Por favor intente nuevamente.';
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
    if (!this.personaNatural) return;

    this.personaNaturalForm.patchValue({
      documento: this.personaNatural.documento || '',
      nombres: this.personaNatural.nombres || '',
      apellidosPaterno: this.personaNatural.apellidosPaterno || '',
      apellidosMaterno: this.personaNatural.apellidosMaterno || '',
      sexo: this.personaNatural.sexo || '',
      direccion: this.personaNatural.persona?.direccion || '',
      observacion: this.personaNatural.persona?.observacion || '',
      fechaNacimiento: this.personaNatural.viajero?.fechaNacimiento || '',
      nacionalidad: this.personaNatural.viajero?.nacionalidad || '',
      residencia: this.personaNatural.viajero?.residencia || '',
      categoriaPersonaId: this.personaNatural.categoriaPersona?.id || null
    });

    this.showPersonaNaturalModal = true;
  }

  cerrarModalPersonaNatural(): void {
    this.showPersonaNaturalModal = false;
    this.personaNaturalForm.reset();
  }

  guardarPersonaNatural(): void {
    if (!this.personaNaturalForm.valid || !this.personaId) return;

    this.loadingService.setLoading(true);

    const formValue = this.personaNaturalForm.value;

    // Preparar datos de persona natural
    const personaNaturalData: PersonaNaturalRequest = {
      documento: formValue.documento,
      nombres: formValue.nombres,
      apellidosPaterno: formValue.apellidosPaterno,
      apellidosMaterno: formValue.apellidosMaterno,
      sexo: formValue.sexo,
      categoriaPersonaId: formValue.categoriaPersonaId || undefined,
      persona: {
        direccion: formValue.direccion,
        observacion: formValue.observacion
      }
    };

    // Actualizar persona natural
    const updatePersonaNatural$ = this.personaNaturalService.update(this.personaId, personaNaturalData);

    // Manejar datos del viajero
    let viajeroOperation$: Observable<any> = of(null);

    // Verificar si se proporcionaron datos de viajero
    const tieneViajeroData = formValue.fechaNacimiento || formValue.nacionalidad || formValue.residencia;

    if (tieneViajeroData) {
      const viajeroData: ViajeroRequest = {
        fechaNacimiento: formValue.fechaNacimiento,
        nacionalidad: formValue.nacionalidad,
        residencia: formValue.residencia
      };

      if (this.personaNatural?.viajero) {
        // Actualizar viajero existente
        viajeroOperation$ = this.viajeroService.update(this.personaNatural.viajero.id, viajeroData);
      } else {
        // Crear nuevo viajero y asociarlo a la persona
        viajeroOperation$ = this.viajeroService.save(viajeroData).pipe(
          switchMap((viajeroCreado: ViajeroResponse) => {
            // Asociar el viajero a la persona natural usando el método específico
            return this.personaNaturalService.asociarViajero(this.personaId!, viajeroCreado.id);
          })
        );
      }
    }

    // Ejecutar las operaciones
    const subscription = forkJoin({
      personaNatural: updatePersonaNatural$,
      viajero: viajeroOperation$
    })
      .pipe(
        tap(() => {
          this.loadPersonaData();
          this.cerrarModalPersonaNatural();
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

  // Empresas management
  abrirModalEmpresa(): void {
    this.showEmpresaModal = true;
  }

  cerrarModalEmpresa(): void {
    this.showEmpresaModal = false;
    this.empresaForm.reset({ empresaIds: [] });
    this.error = null;
  }

  onEmpresaCheckboxChange(event: any, empresaId: number): void {
    const isChecked = event.target.checked;
    const empresaIds = this.empresaForm.get('empresaIds')?.value || [];

    if (isChecked) {
      if (!empresaIds.includes(empresaId)) {
        empresaIds.push(empresaId);
      }
    } else {
      const index = empresaIds.indexOf(empresaId);
      if (index > -1) {
        empresaIds.splice(index, 1);
      }
    }

    this.empresaForm.get('empresaIds')?.setValue(empresaIds);
  }

  private recargarEmpresasAsociadas(): void {
    if (!this.personaId) return;

    const subscription = this.naturalJuridicoService.findByPersonaNaturalId(this.personaId)
      .pipe(
        tap(result => {
          this.empresasAsociadas = this.extractEmpresasAsociadas(result);
        }),
        catchError(error => {
          return of([]);
        })
      )
      .subscribe();

    this.subscriptions.add(subscription);
  }

  asociarEmpresas(): void {
    if (!this.empresaForm.valid || !this.personaId) return;

    const empresaIds: number[] = this.empresaForm.get('empresaIds')?.value || [];

    if (empresaIds.length === 0) return;

    this.loadingService.setLoading(true);

    const request: NaturalJuridicaRequest = {
      personaNaturalId: this.personaId,
      personasJuridicasIds: empresaIds
    };

    const subscription = this.naturalJuridicoService.create(request)
      .pipe(
        tap((response) => {
          this.recargarEmpresasAsociadas();
          this.cerrarModalEmpresa();
        }),
        catchError(error => {
          this.error = 'Error al asociar empresas';
          return of(null);
        }),
        finalize(() => {
          this.loadingService.setLoading(false);
        })
      )
      .subscribe();

    this.subscriptions.add(subscription);
  }

  desasociarEmpresa(empresa: PersonaJuridicaResponse): void {
    if (!this.personaId) return;
    if (!confirm(`¿Está seguro de desasociar la empresa "${empresa.razonSocial}"?`)) return;
    this.loadingService.setLoading(true);

    const subscription = this.naturalJuridicoService.deleteByPersonas(this.personaId, empresa.id)
      .pipe(
        tap(() => {
          this.recargarEmpresasAsociadas();
        }),
        catchError(error => {
          this.error = 'Error al desasociar empresa. Por favor intente nuevamente.';
          return of(null);
        }),
        finalize(() => {
          this.loadingService.setLoading(false);
        })
      )
      .subscribe();

    this.subscriptions.add(subscription);
  }

  // Viajeros Frecuentes management
  abrirModalViajeroFrecuente(viajero?: ViajeroFrecuenteResponse): void {
    this.editingViajeroFrecuenteId = viajero?.id || null;

    if (viajero) {
      this.viajeroFrecuenteForm.patchValue({
        areolinea: viajero.areolinea,
        codigo: viajero.codigo
      });
    } else {
      this.viajeroFrecuenteForm.reset();
    }

    this.showViajeroFrecuenteModal = true;
  }

  cerrarModalViajeroFrecuente(): void {
    this.showViajeroFrecuenteModal = false;
    this.editingViajeroFrecuenteId = null;
    this.viajeroFrecuenteForm.reset();
  }

  guardarViajeroFrecuente(): void {
    if (!this.viajeroFrecuenteForm.valid || !this.personaId) return;

    const viajeroData: ViajeroFrecuenteRequest = this.viajeroFrecuenteForm.value;

    // Si la persona no tiene viajero asociado, crear uno primero
    if (!this.personaNatural?.viajero) {
      this.crearViajeroYAsociarFrecuente(viajeroData);
      return;
    }

    // Si ya tiene viajero, proceder normalmente
    let operation$: Observable<ViajeroFrecuenteResponse>;

    if (this.editingViajeroFrecuenteId)
      operation$ = this.viajeroFrecuenteService.actualizar(this.editingViajeroFrecuenteId, viajeroData);
    else
      operation$ = this.viajeroFrecuenteService.crear(this.personaNatural.viajero.id, viajeroData);

    const subscription = operation$
      .pipe(
        tap(() => {
          this.loadViajerosFrecuentes(this.personaNatural!.viajero!.id);
          this.cerrarModalViajeroFrecuente();
        }),
        catchError(error => {
          this.error = 'Error al guardar el viajero frecuente';
          return of(null);
        })
      )
      .subscribe();

    this.subscriptions.add(subscription);
  }

  private crearViajeroYAsociarFrecuente(viajeroFrecuenteData: ViajeroFrecuenteRequest): void {
    this.loadingService.setLoading(true);

    // Crear un viajero básico con datos mínimos
    const viajeroRequest: ViajeroRequest = {
      fechaNacimiento: undefined, // Se puede actualizar después
      nacionalidad: 'Peruana', // Valor por defecto
      residencia: 'Perú' // Valor por defecto
    };

    const subscription = this.viajeroService.save(viajeroRequest)
      .pipe(
        tap((viajeroCreado: ViajeroResponse) => {
          // Ahora asociar este viajero a la persona natural
          this.asociarViajeroAPersona(viajeroCreado.id, viajeroFrecuenteData);
        }),
        catchError(error => {
          this.error = 'Error al crear la información de viajero';
          this.loadingService.setLoading(false);
          return of(null);
        })
      )
      .subscribe();

    this.subscriptions.add(subscription);
  }

  private asociarViajeroAPersona(viajeroId: number, viajeroFrecuenteData: ViajeroFrecuenteRequest): void {
    if (!this.personaId) return;

    // Actualizar la persona natural para asociarle el viajero
    const personaNaturalData: PersonaNaturalRequest = {
      nombres: this.personaNatural?.nombres || '',
      apellidosPaterno: this.personaNatural?.apellidosPaterno || '',
      apellidosMaterno: this.personaNatural?.apellidosMaterno || '',
      documento: this.personaNatural?.documento || '',
      sexo: this.personaNatural?.sexo || '',
      viajeroId: viajeroId, // Asociar el viajero recién creado
      persona: {
        direccion: this.personaNatural?.persona?.direccion || '',
        observacion: this.personaNatural?.persona?.observacion || ''
      }
    };

    const subscription = this.personaNaturalService.update(this.personaId, personaNaturalData)
      .pipe(
        tap(() => {
          // Recargar los datos para tener el viajero actualizado
          this.loadPersonaData();

          // Crear el viajero frecuente ahora que ya tiene viajero asociado
          const createViajeroFrecuente$ = this.viajeroFrecuenteService.crear(viajeroId, viajeroFrecuenteData);

          const frecuenteSubscription = createViajeroFrecuente$
            .pipe(
              tap(() => {
                this.cerrarModalViajeroFrecuente();
              }),
              catchError(error => {
                this.error = 'Error al crear el viajero frecuente';
                return of(null);
              }),
              finalize(() => {
                this.loadingService.setLoading(false);
              })
            )
            .subscribe();

          this.subscriptions.add(frecuenteSubscription);
        }),
        catchError(error => {
          this.error = 'Error al asociar el viajero a la persona';
          this.loadingService.setLoading(false);
          return of(null);
        })
      )
      .subscribe();

    this.subscriptions.add(subscription);
  }

  eliminarViajeroFrecuente(viajero: ViajeroFrecuenteResponse): void {
    if (!confirm('¿Está seguro de eliminar este viajero frecuente?')) return;

    const subscription = this.viajeroFrecuenteService.eliminar(viajero.id)
      .pipe(
        tap(() => {
          if (this.personaNatural?.viajero) {
            this.loadViajerosFrecuentes(this.personaNatural.viajero.id);
          }
        }),
        catchError(error => {
          this.error = 'Error al eliminar el viajero frecuente';
          return of(null);
        })
      )
      .subscribe();

    this.subscriptions.add(subscription);
  }

  // Documentos management
  abrirModalDocumento(documento?: DetalleDocumentoResponse): void {
    this.editingDocumentoId = documento?.id || null;

    if (documento) {
      this.documentoForm.patchValue({
        numero: documento.numero,
        fechaEmision: documento.fechaEmision || '',
        fechaVencimiento: documento.fechaVencimiento || '',
        origen: documento.origen,
        documentoId: documento.documento.id
      });
    } else {
      this.documentoForm.reset();
    }

    this.showDocumentoModal = true;
  }

  cerrarModalDocumento(): void {
    this.showDocumentoModal = false;
    this.editingDocumentoId = null;
    this.documentoForm.reset();
  }

  guardarDocumento(): void {
    if (!this.documentoForm.valid || !this.personaId) return;

    const documentoData: DetalleDocumentoRequest = {
      ...this.documentoForm.value,
      personaNaturalId: this.personaId
    };

    let operation$: Observable<DetalleDocumentoResponse>;

    if (this.editingDocumentoId) {
      operation$ = this.detalleDocumentoService.updateDetalle(this.editingDocumentoId, documentoData);
    } else {
      operation$ = this.detalleDocumentoService.saveDetalle(documentoData);
    }

    const subscription = operation$
      .pipe(
        tap(() => {
          this.recargarDocumentos();
          this.cerrarModalDocumento();
        }),
        catchError(error => {
          console.error('Error al guardar documento:', error);
          this.error = 'Error al guardar el documento';
          return of(null);
        })
      )
      .subscribe();

    this.subscriptions.add(subscription);
  }

  eliminarDocumento(documento: DetalleDocumentoResponse): void {
    if (!confirm('¿Está seguro de eliminar este documento?')) return;

    const subscription = this.detalleDocumentoService.deleteDetalle(documento.id)
      .pipe(
        tap(() => this.recargarDocumentos()),
        catchError(error => {
          this.error = 'Error al eliminar el documento';
          return of(null);
        })
      )
      .subscribe();

    this.subscriptions.add(subscription);
  }

  private recargarDocumentos(): void {
    if (!this.personaId) return;

    const subscription = this.detalleDocumentoService.findByPersonaNaturalId(this.personaId)
      .subscribe(documentos => {
        this.documentos = documentos;
      });

    this.subscriptions.add(subscription);
  }

  getTipoDocumentoNombre(documentoId: number): string {
    const doc = this.tiposDocumento.find(d => d.id === documentoId);
    return doc ? doc.tipo : 'N/A';
  }

  // Utility methods for display
  getEmpresasNoAsociadas(): PersonaJuridicaResponse[] {
    const asociadasIds = this.empresasAsociadas.map(e => e.id);
    return this.todasLasEmpresas.filter(e => !asociadasIds.includes(e.id));
  }

  isEmpresaSeleccionada(empresaId: number): boolean {
    const empresaIds = this.empresaForm.get('empresaIds')?.value || [];
    return empresaIds.includes(empresaId);
  }
}
