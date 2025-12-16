import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, Observable, of, forkJoin } from 'rxjs';
import { catchError, finalize, tap, switchMap } from 'rxjs/operators';

// Services
import { LoadingService } from '../../core/service/loading.service';
import { ErrorHandlerService } from '../../core/service/error-handler.service';
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
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';

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
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ErrorModalComponent, ErrorModalData } from '../../shared/components/error-modal/error-modal.component';
import { ConfirmationModalComponent, ConfirmationConfig } from '../../shared/components/confirmation-modal/confirmation-modal.component';

interface CodigoPais {
  code: string;
  name: string;
  dialCode: string;
}

interface DocumentoCreacionData {
  numero: string;
  origen: string;
  documentoId: number;
  fechaEmision?: string;
  fechaVencimiento?: string;
}

@Component({
  selector: 'app-detalle-persona',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent, ErrorModalComponent, ConfirmationModalComponent],
  templateUrl: './detalle-persona.component.html',
  styleUrls: ['./detalle-persona.component.css']
})
export class DetallePersonaComponent implements OnInit, OnDestroy {

  // Services injection
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private loadingService = inject(LoadingService);
  private errorHandlerService = inject(ErrorHandlerService);
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

  // Confirmation modal
  showConfirmation = false;
  confirmationConfig: ConfirmationConfig = {
    title: '',
    message: '',
    type: 'warning'
  };
  documentoPendienteEliminar: DetalleDocumentoResponse | null = null;
  personaNaturalForm!: FormGroup;
  showPersonaNaturalModal = false;
  editingViajeroFrecuenteId: number | null = null;
  isCreating: boolean = false;

  codigosPaises: CodigoPais[] = [
    { code: 'AF', name: 'Afganistán', dialCode: '+93' },
    { code: 'AL', name: 'Albania', dialCode: '+355' },
    { code: 'DE', name: 'Alemania', dialCode: '+49' },
    { code: 'AD', name: 'Andorra', dialCode: '+376' },
    { code: 'AO', name: 'Angola', dialCode: '+244' },
    { code: 'AI', name: 'Anguila', dialCode: '+1-264' },
    { code: 'AG', name: 'Antigua y Barbuda', dialCode: '+1-268' },
    { code: 'SA', name: 'Arabia Saudita', dialCode: '+966' },
    { code: 'DZ', name: 'Argelia', dialCode: '+213' },
    { code: 'AR', name: 'Argentina', dialCode: '+54' },
    { code: 'AM', name: 'Armenia', dialCode: '+374' },
    { code: 'AW', name: 'Aruba', dialCode: '+297' },
    { code: 'AU', name: 'Australia', dialCode: '+61' },
    { code: 'AT', name: 'Austria', dialCode: '+43' },
    { code: 'AZ', name: 'Azerbaiyán', dialCode: '+994' },
    { code: 'BS', name: 'Bahamas', dialCode: '+1-242' },
    { code: 'BH', name: 'Baréin', dialCode: '+973' },
    { code: 'BD', name: 'Bangladés', dialCode: '+880' },
    { code: 'BB', name: 'Barbados', dialCode: '+1-246' },
    { code: 'BE', name: 'Bélgica', dialCode: '+32' },
    { code: 'BZ', name: 'Belice', dialCode: '+501' },
    { code: 'BJ', name: 'Benín', dialCode: '+229' },
    { code: 'BY', name: 'Bielorrusia', dialCode: '+375' },
    { code: 'BO', name: 'Bolivia', dialCode: '+591' },
    { code: 'BA', name: 'Bosnia y Herzegovina', dialCode: '+387' },
    { code: 'BW', name: 'Botsuana', dialCode: '+267' },
    { code: 'BR', name: 'Brasil', dialCode: '+55' },
    { code: 'BN', name: 'Brunéi', dialCode: '+673' },
    { code: 'BG', name: 'Bulgaria', dialCode: '+359' },
    { code: 'BF', name: 'Burkina Faso', dialCode: '+226' },
    { code: 'BI', name: 'Burundi', dialCode: '+257' },
    { code: 'BT', name: 'Bután', dialCode: '+975' },
    { code: 'CV', name: 'Cabo Verde', dialCode: '+238' },
    { code: 'KH', name: 'Camboya', dialCode: '+855' },
    { code: 'CM', name: 'Camerún', dialCode: '+237' },
    { code: 'CA', name: 'Canadá', dialCode: '+1' },
    { code: 'QA', name: 'Catar', dialCode: '+974' },
    { code: 'CL', name: 'Chile', dialCode: '+56' },
    { code: 'CN', name: 'China', dialCode: '+86' },
    { code: 'CY', name: 'Chipre', dialCode: '+357' },
    { code: 'CO', name: 'Colombia', dialCode: '+57' },
    { code: 'KM', name: 'Comoras', dialCode: '+269' },
    { code: 'CG', name: 'Congo', dialCode: '+242' },
    { code: 'KR', name: 'Corea del Sur', dialCode: '+82' },
    { code: 'CR', name: 'Costa Rica', dialCode: '+506' },
    { code: 'HR', name: 'Croacia', dialCode: '+385' },
    { code: 'CU', name: 'Cuba', dialCode: '+53' },
    { code: 'DK', name: 'Dinamarca', dialCode: '+45' },
    { code: 'DM', name: 'Dominica', dialCode: '+1-767' },
    { code: 'EC', name: 'Ecuador', dialCode: '+593' },
    { code: 'EG', name: 'Egipto', dialCode: '+20' },
    { code: 'SV', name: 'El Salvador', dialCode: '+503' },
    { code: 'AE', name: 'Emiratos Árabes Unidos', dialCode: '+971' },
    { code: 'ER', name: 'Eritrea', dialCode: '+291' },
    { code: 'SK', name: 'Eslovaquia', dialCode: '+421' },
    { code: 'SI', name: 'Eslovenia', dialCode: '+386' },
    { code: 'ES', name: 'España', dialCode: '+34' },
    { code: 'US', name: 'Estados Unidos', dialCode: '+1' },
    { code: 'EE', name: 'Estonia', dialCode: '+372' },
    { code: 'ET', name: 'Etiopía', dialCode: '+251' },
    { code: 'PH', name: 'Filipinas', dialCode: '+63' },
    { code: 'FI', name: 'Finlandia', dialCode: '+358' },
    { code: 'FR', name: 'Francia', dialCode: '+33' },
    { code: 'GA', name: 'Gabón', dialCode: '+241' },
    { code: 'GM', name: 'Gambia', dialCode: '+220' },
    { code: 'GE', name: 'Georgia', dialCode: '+995' },
    { code: 'GH', name: 'Ghana', dialCode: '+233' },
    { code: 'GR', name: 'Grecia', dialCode: '+30' },
    { code: 'GD', name: 'Granada', dialCode: '+1-473' },
    { code: 'GT', name: 'Guatemala', dialCode: '+502' },
    { code: 'GN', name: 'Guinea', dialCode: '+224' },
    { code: 'GQ', name: 'Guinea Ecuatorial', dialCode: '+240' },
    { code: 'GW', name: 'Guinea-Bisáu', dialCode: '+245' },
    { code: 'GY', name: 'Guyana', dialCode: '+592' },
    { code: 'HT', name: 'Haití', dialCode: '+509' },
    { code: 'HN', name: 'Honduras', dialCode: '+504' },
    { code: 'HU', name: 'Hungría', dialCode: '+36' },
    { code: 'IN', name: 'India', dialCode: '+91' },
    { code: 'ID', name: 'Indonesia', dialCode: '+62' },
    { code: 'IQ', name: 'Irak', dialCode: '+964' },
    { code: 'IR', name: 'Irán', dialCode: '+98' },
    { code: 'IE', name: 'Irlanda', dialCode: '+353' },
    { code: 'IS', name: 'Islandia', dialCode: '+354' },
    { code: 'IL', name: 'Israel', dialCode: '+972' },
    { code: 'IT', name: 'Italia', dialCode: '+39' },
    { code: 'JM', name: 'Jamaica', dialCode: '+1-876' },
    { code: 'JP', name: 'Japón', dialCode: '+81' },
    { code: 'JO', name: 'Jordania', dialCode: '+962' },
    { code: 'KZ', name: 'Kazajistán', dialCode: '+7' },
    { code: 'KE', name: 'Kenia', dialCode: '+254' },
    { code: 'KG', name: 'Kirguistán', dialCode: '+996' },
    { code: 'KI', name: 'Kiribati', dialCode: '+686' },
    { code: 'KW', name: 'Kuwait', dialCode: '+965' },
    { code: 'LA', name: 'Laos', dialCode: '+856' },
    { code: 'LV', name: 'Letonia', dialCode: '+371' },
    { code: 'LB', name: 'Líbano', dialCode: '+961' },
    { code: 'LY', name: 'Libia', dialCode: '+218' },
    { code: 'LI', name: 'Liechtenstein', dialCode: '+423' },
    { code: 'LT', name: 'Lituania', dialCode: '+370' },
    { code: 'LU', name: 'Luxemburgo', dialCode: '+352' },
    { code: 'MY', name: 'Malasia', dialCode: '+60' },
    { code: 'MW', name: 'Malaui', dialCode: '+265' },
    { code: 'MV', name: 'Maldivas', dialCode: '+960' },
    { code: 'ML', name: 'Malí', dialCode: '+223' },
    { code: 'MT', name: 'Malta', dialCode: '+356' },
    { code: 'MA', name: 'Marruecos', dialCode: '+212' },
    { code: 'MU', name: 'Mauricio', dialCode: '+230' },
    { code: 'MX', name: 'México', dialCode: '+52' },
    { code: 'MD', name: 'Moldavia', dialCode: '+373' },
    { code: 'MC', name: 'Mónaco', dialCode: '+377' },
    { code: 'MN', name: 'Mongolia', dialCode: '+976' },
    { code: 'ME', name: 'Montenegro', dialCode: '+382' },
    { code: 'MZ', name: 'Mozambique', dialCode: '+258' },
    { code: 'NA', name: 'Namibia', dialCode: '+264' },
    { code: 'NP', name: 'Nepal', dialCode: '+977' },
    { code: 'NI', name: 'Nicaragua', dialCode: '+505' },
    { code: 'NE', name: 'Níger', dialCode: '+227' },
    { code: 'NG', name: 'Nigeria', dialCode: '+234' },
    { code: 'NO', name: 'Noruega', dialCode: '+47' },
    { code: 'NZ', name: 'Nueva Zelanda', dialCode: '+64' },
    { code: 'OM', name: 'Omán', dialCode: '+968' },
    { code: 'NL', name: 'Países Bajos', dialCode: '+31' },
    { code: 'PK', name: 'Pakistán', dialCode: '+92' },
    { code: 'PA', name: 'Panamá', dialCode: '+507' },
    { code: 'PG', name: 'Papúa Nueva Guinea', dialCode: '+675' },
    { code: 'PY', name: 'Paraguay', dialCode: '+595' },
    { code: 'PE', name: 'Perú', dialCode: '+51' },
    { code: 'PL', name: 'Polonia', dialCode: '+48' },
    { code: 'PT', name: 'Portugal', dialCode: '+351' },
    { code: 'PR', name: 'Puerto Rico', dialCode: '+1-787' },
    { code: 'GB', name: 'Reino Unido', dialCode: '+44' },
    { code: 'CZ', name: 'República Checa', dialCode: '+420' },
    { code: 'DO', name: 'República Dominicana', dialCode: '+1-809' },
    { code: 'RO', name: 'Rumania', dialCode: '+40' },
    { code: 'RU', name: 'Rusia', dialCode: '+7' },
    { code: 'RW', name: 'Ruanda', dialCode: '+250' },
    { code: 'WS', name: 'Samoa', dialCode: '+685' },
    { code: 'SM', name: 'San Marino', dialCode: '+378' },
    { code: 'SN', name: 'Senegal', dialCode: '+221' },
    { code: 'RS', name: 'Serbia', dialCode: '+381' },
    { code: 'SC', name: 'Seychelles', dialCode: '+248' },
    { code: 'SL', name: 'Sierra Leona', dialCode: '+232' },
    { code: 'SG', name: 'Singapur', dialCode: '+65' },
    { code: 'SY', name: 'Siria', dialCode: '+963' },
    { code: 'SO', name: 'Somalia', dialCode: '+252' },
    { code: 'LK', name: 'Sri Lanka', dialCode: '+94' },
    { code: 'ZA', name: 'Sudáfrica', dialCode: '+27' },
    { code: 'SD', name: 'Sudán', dialCode: '+249' },
    { code: 'SE', name: 'Suecia', dialCode: '+46' },
    { code: 'CH', name: 'Suiza', dialCode: '+41' },
    { code: 'TH', name: 'Tailandia', dialCode: '+66' },
    { code: 'TZ', name: 'Tanzania', dialCode: '+255' },
    { code: 'TT', name: 'Trinidad y Tobago', dialCode: '+1-868' },
    { code: 'TN', name: 'Túnez', dialCode: '+216' },
    { code: 'TR', name: 'Turquía', dialCode: '+90' },
    { code: 'UA', name: 'Ucrania', dialCode: '+380' },
    { code: 'UG', name: 'Uganda', dialCode: '+256' },
    { code: 'UY', name: 'Uruguay', dialCode: '+598' },
    { code: 'UZ', name: 'Uzbekistán', dialCode: '+998' },
    { code: 'VE', name: 'Venezuela', dialCode: '+58' },
    { code: 'VN', name: 'Vietnam', dialCode: '+84' },
    { code: 'YE', name: 'Yemen', dialCode: '+967' },
    { code: 'ZM', name: 'Zambia', dialCode: '+260' },
    { code: 'ZW', name: 'Zimbabue', dialCode: '+263' }
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

  // Error Modal
  showErrorModal = false;
  errorModalData: ErrorModalData | null = null;
  backendErrorResponse: any = null;

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

  // Filtro de países
  busquedaPais = '';
  paisesFiltrados: CodigoPais[] = [];

  // Sidebar Configuration
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

  private subscriptions = new Subscription();

  constructor(
    private menuConfigService: MenuConfigService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/personas/detalle/:id');
    this.loadPersonaFromRoute();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeForms(): void {
    this.personaNaturalForm = this.fb.group({
      nombres: ['', [Validators.required]],
      apellidosPaterno: ['', [Validators.required]],
      apellidosMaterno: [''],
      sexo: [''],
      direccion: [''],
      observacion: [''],
      fechaNacimiento: [''],
      nacionalidad: [''],
      residencia: [''],
      categoriaPersonaId: [null],
      // Documento inicial - TODOS LOS CAMPOS OPCIONALES
      documentoInicial: this.fb.group({
        numero: [''],
        fechaEmision: [''],
        fechaVencimiento: [''],
        origen: [''],
        documentoId: ['']
      })
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
      this.loadDatosParaCreacion();
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
          this.mostrarErrorModal(error);
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
          this.mostrarErrorModal(error);
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

  // Validar formulario de creación con validación condicional para documento
  isFormularioCreacionValido(): boolean {
    const nombresControl = this.personaNaturalForm.get('nombres');
    const apellidoPatControl = this.personaNaturalForm.get('apellidosPaterno');

    // Validar campos básicos de persona
    const personaValida = !!(
      nombresControl?.value &&
      nombresControl?.valid &&
      apellidoPatControl?.value &&
      apellidoPatControl?.valid
    );

    if (!personaValida) {
      return false;
    }

    // Validación condicional del documento inicial
    const docInicial = this.personaNaturalForm.get('documentoInicial');
    const numero = docInicial?.get('numero')?.value;
    const origen = docInicial?.get('origen')?.value;
    const documentoId = docInicial?.get('documentoId')?.value;
    const fechaEmision = docInicial?.get('fechaEmision')?.value;
    const fechaVencimiento = docInicial?.get('fechaVencimiento')?.value;

    // Si el usuario llenó CUALQUIER campo del documento
    const algunCampoLleno = numero || origen || documentoId || fechaEmision || fechaVencimiento;

    if (algunCampoLleno) {
      // Entonces numero, origen y documentoId son OBLIGATORIOS
      const documentoValido = !!(
        numero?.trim() &&
        origen?.trim() &&
        documentoId
      );

      return documentoValido;
    }

    // Si no llenó nada del documento, es válido (documento opcional)
    return true;
  }

  crearPersonaNatural(): void {
    if (!this.isFormularioCreacionValido()) {
      this.markFormGroupTouched(this.personaNaturalForm);
      return;
    }

    this.loadingService.setLoading(true);

    const formValue = this.personaNaturalForm.value;
    const documentoData = formValue.documentoInicial;

    // Preparar datos de PersonaNatural SIN documento (opcional)
    const personaNaturalData: PersonaNaturalRequest = {
      documento: documentoData?.numero ? documentoData.numero.trim() : '', // Opcional
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

    // Verificar si hay datos de documento COMPLETOS para crear detalleDocumento
    const tieneDocumentoCompleto = documentoData?.numero &&
      documentoData?.documentoId &&
      documentoData?.origen;

    const subscription = this.personaNaturalService.save(personaNaturalData)
      .pipe(
        switchMap((personaResponse) => {
          // Si hay datos de documento COMPLETOS, crear el detalleDocumento
          if (tieneDocumentoCompleto) {
            const documentoId = parseInt(documentoData.documentoId, 10);
            const detalleDocumento: DetalleDocumentoRequest = {
              numero: documentoData.numero.trim(),
              origen: documentoData.origen.trim(),
              documentoId: documentoId,
              personaNaturalId: personaResponse.id,
              fechaEmision: documentoData.fechaEmision || undefined,
              fechaVencimiento: documentoData.fechaVencimiento || undefined
            };

            // Crear detalleDocumento
            return this.detalleDocumentoService.saveDetalle(detalleDocumento).pipe(
              tap(() => {
                // Éxito en ambas creaciones
                this.isCreating = false;
                this.personaId = personaResponse.id;
                this.router.navigate(['/personas/detalle', personaResponse.id], { replaceUrl: true });
                this.loadPersonaData();
              }),
              catchError(error => {
                console.error('Error al crear documento:', error);
                this.mostrarErrorModal(error);
                return of(null);
              })
            );
          } else {
            // PersonaNatural se creó sin documento - ESTO ES OK
            this.isCreating = false;
            this.personaId = personaResponse.id;
            this.router.navigate(['/personas/detalle', personaResponse.id], { replaceUrl: true });
            this.loadPersonaData();
            return of(null);
          }
        }),
        catchError(error => {
          console.error('Error al crear cliente:', error);
          this.mostrarErrorModal(error);
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

    // Remover documentoInicial si existe (solo es para creación)
    if (this.personaNaturalForm.get('documentoInicial')) {
      this.personaNaturalForm.removeControl('documentoInicial');
    }

    this.personaNaturalForm.patchValue({
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
        residencia: formValue.residencia,
        personaId: this.personaId
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
          this.mostrarErrorModal(error);
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
    this.busquedaPais = ''; // Resetear búsqueda
    this.paisesFiltrados = [...this.codigosPaises]; // Mostrar todos al abrir

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

  // Filtrar países según búsqueda
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

  // Seleccionar país del filtro
  seleccionarPais(dialCode: string): void {
    this.telefonoForm.patchValue({ codigoPais: dialCode });
    this.busquedaPais = ''; // Limpiar búsqueda
    this.paisesFiltrados = [...this.codigosPaises]; // Resetear lista
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
          this.mostrarErrorModal(error);
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
          this.mostrarErrorModal(error);
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
          this.mostrarErrorModal(error);
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
          this.mostrarErrorModal(error);
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
      personaNaturalId: this.personaNatural!.id,
      personasJuridicasIds: empresaIds
    };

    const subscription = this.naturalJuridicoService.create(request)
      .pipe(
        tap((response) => {
          this.recargarEmpresasAsociadas();
          this.cerrarModalEmpresa();
        }),
        catchError(error => {
          this.mostrarErrorModal(error);
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

    const subscription = this.naturalJuridicoService.deleteByPersonas(this.personaNatural!.id, empresa.id)
      .pipe(
        tap(() => {
          this.recargarEmpresasAsociadas();
        }),
        catchError(error => {
          this.mostrarErrorModal(error);
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
          this.mostrarErrorModal(error);
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
      residencia: 'Perú', // Valor por defecto
      personaId: this.personaId!
    };

    const subscription = this.viajeroService.save(viajeroRequest)
      .pipe(
        tap((viajeroCreado: ViajeroResponse) => {
          // Ahora asociar este viajero a la persona natural
          this.asociarViajeroAPersona(viajeroCreado.id, viajeroFrecuenteData);
        }),
        catchError(error => {
          this.mostrarErrorModal(error);
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
                this.mostrarErrorModal(error);
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
          this.mostrarErrorModal(error);
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
          this.mostrarErrorModal(error);
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
      personaNaturalId: this.personaNatural!.id
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
          this.mostrarErrorModal(error);
          return of(null);
        })
      )
      .subscribe();

    this.subscriptions.add(subscription);
  }

  eliminarDocumento(documento: DetalleDocumentoResponse): void {
    // Guardar referencia del documento y mostrar confirmación
    this.documentoPendienteEliminar = documento;
    this.confirmationConfig = {
      title: '¿Eliminar documento?',
      message: `¿Está seguro de eliminar el documento ${documento.documento.tipo} N° ${documento.numero}?`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'fas fa-file-alt text-red-500'
    };
    this.showConfirmation = true;
  }

  onConfirmDeleteDocumento(): void {
    if (!this.documentoPendienteEliminar) return;

    const subscription = this.detalleDocumentoService.deleteDetalle(this.documentoPendienteEliminar.id)
      .pipe(
        tap(() => {
          this.recargarDocumentos();
          this.showConfirmation = false;
          this.documentoPendienteEliminar = null;
        }),
        catchError(error => {
          this.mostrarErrorModal(error);
          this.showConfirmation = false;
          return of(null);
        })
      )
      .subscribe();

    this.subscriptions.add(subscription);
  }

  onCancelDeleteDocumento(): void {
    this.showConfirmation = false;
    this.documentoPendienteEliminar = null;
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

  // Error Modal Management
  mostrarErrorModal(error: any): void {
    const mensaje = this.errorHandlerService.getErrorMessage(error);
    const status = this.errorHandlerService.getStatusCode(error) || 500;

    this.errorModalData = {
      title: `Error ${status}`,
      message: mensaje,
      type: 'error',
      buttonText: 'Entendido'
    };

    this.backendErrorResponse = error?.error || null;
    this.showErrorModal = true;
  }

  cerrarErrorModal(): void {
    this.showErrorModal = false;
    this.errorModalData = null;
    this.backendErrorResponse = null;
  }
}
