import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';
import { AuditoriaService, AuditoriaFilterParams } from '../../core/service/auditoria/auditoria.service';
import { AuditoriaItem, AuditoriaDetalle, AuditoriaStats } from '../../core/models/auditoria/auditoria.model';

export type FormattedValueType = 'texto' | 'numero' | 'booleano' | 'fecha' | 'cifrado' | 'moneda' | 'objeto' | 'vacio';

export interface ParsedDiffItem {
  campoOriginal: string;
  campoLegible: string;
  antes: any;
  ahora: any;
  antesFormateado: string;
  ahoraFormateado: string;
  tipo: FormattedValueType;
}

export interface PropiedadItem {
  claveOriginal: string;
  etiqueta: string;
  valorOriginal: any;
  valorFormateado: string;
  tipo: FormattedValueType;
}

export interface ResumenEvento {
  titulo: string;
  descripcion: string;
  totalCambios: number;
  esCreacion: boolean;
  esEliminacion: boolean;
  esModificacion: boolean;
  esConsulta: boolean;
}

export interface TablaConfigItem {
  label: string;
  icon: string;
  colorClass: string;
}

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SidebarComponent
  ],
  templateUrl: './auditoria.component.html',
  styleUrls: ['./auditoria.component.css']
})
export class AuditoriaComponent implements OnInit {

  private router = inject(Router);
  private auditoriaService = inject(AuditoriaService);
  private menuConfigService = inject(MenuConfigService);

  // Sidebar
  sidebarCollapsed = false;
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

  // Datos
  auditorias: AuditoriaItem[] = [];
  tablasDisponibles: string[] = [];
  stats: AuditoriaStats = {
    totalEventos: 0,
    eventosHoy: 0,
    creaciones: 0,
    modificaciones: 0,
    eliminaciones: 0,
    consultas: 0
  };

  // Estados de carga
  loading = false;
  loadingModal = false;

  // Filtros
  searchTerm = '';
  selectedTabla = '';
  selectedAccion = '';
  fechaInicio = '';
  fechaFin = '';

  // Paginación
  currentPage = 0;
  pageSize = 15;
  totalElements = 0;
  totalPages = 0;

  // Modal de Detalle / Diff
  modalAbierto = false;
  detalleSeleccionado: AuditoriaDetalle | null = null;
  parsedDiffList: ParsedDiffItem[] = [];
  propiedadesPrevias: PropiedadItem[] = [];
  propiedadesNuevas: PropiedadItem[] = [];
  propiedadesCreadas: PropiedadItem[] = [];
  propiedadesEliminadas: PropiedadItem[] = [];
  resumenEvento: ResumenEvento | null = null;

  activeModalTab: 'cambios' | 'previo' | 'nuevo' | 'seguridad' = 'cambios';
  modoVistaSnapshot: 'amigable' | 'json' = 'amigable';
  filtroCampos = '';
  copiadoJson = false;

  // Diccionario de configuración visual de Módulos / Tablas
  private readonly tablaConfig: Record<string, TablaConfigItem> = {
    cotizacion: { label: 'Cotizaciones de Viajes', icon: 'fa-file-invoice-dollar', colorClass: 'text-blue-700 bg-blue-50 border-blue-200' },
    cotizaciones: { label: 'Cotizaciones de Viajes', icon: 'fa-file-invoice-dollar', colorClass: 'text-blue-700 bg-blue-50 border-blue-200' },
    detalle_cotizacion: { label: 'Detalle de Cotización', icon: 'fa-list-check', colorClass: 'text-blue-700 bg-blue-50 border-blue-200' },
    historial_cotizacion: { label: 'Historial de Cotización', icon: 'fa-clock-rotate-left', colorClass: 'text-blue-700 bg-blue-50 border-blue-200' },
    persona: { label: 'Clientes / Directorio', icon: 'fa-users', colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    personas: { label: 'Clientes / Directorio', icon: 'fa-users', colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    persona_natural: { label: 'Persona Natural (Cliente)', icon: 'fa-user', colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    persona_juridica: { label: 'Persona Jurídica (Empresa)', icon: 'fa-building', colorClass: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    viajero: { label: 'Pasajero / Viajero', icon: 'fa-plane-departure', colorClass: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
    viajero_frecuente: { label: 'Viajero Frecuente', icon: 'fa-star', colorClass: 'text-amber-700 bg-amber-50 border-amber-200' },
    liquidacion: { label: 'Liquidaciones de Viaje', icon: 'fa-calculator', colorClass: 'text-amber-700 bg-amber-50 border-amber-200' },
    detalle_liquidacion: { label: 'Detalle de Liquidación', icon: 'fa-receipt', colorClass: 'text-amber-700 bg-amber-50 border-amber-200' },
    observacion_liquidacion: { label: 'Observaciones de Liquidación', icon: 'fa-comment-dots', colorClass: 'text-amber-700 bg-amber-50 border-amber-200' },
    recibo: { label: 'Recibos de Pago', icon: 'fa-money-bill-wave', colorClass: 'text-teal-700 bg-teal-50 border-teal-200' },
    detalle_recibo: { label: 'Detalle de Recibo', icon: 'fa-file-lines', colorClass: 'text-teal-700 bg-teal-50 border-teal-200' },
    documento_cobranza: { label: 'Documentos de Cobranza', icon: 'fa-cash-register', colorClass: 'text-teal-700 bg-teal-50 border-teal-200' },
    detalle_documento_cobranza: { label: 'Detalle de Cobranza', icon: 'fa-file-invoice', colorClass: 'text-teal-700 bg-teal-50 border-teal-200' },
    pago_pax: { label: 'Pagos de Pasajeros', icon: 'fa-hand-holding-dollar', colorClass: 'text-teal-700 bg-teal-50 border-teal-200' },
    user: { label: 'Usuarios y Accesos', icon: 'fa-user-shield', colorClass: 'text-violet-700 bg-violet-50 border-violet-200' },
    usuario: { label: 'Usuarios y Accesos', icon: 'fa-user-shield', colorClass: 'text-violet-700 bg-violet-50 border-violet-200' },
    role: { label: 'Roles y Perfiles', icon: 'fa-key', colorClass: 'text-purple-700 bg-purple-50 border-purple-200' },
    rol: { label: 'Roles y Perfiles', icon: 'fa-key', colorClass: 'text-purple-700 bg-purple-50 border-purple-200' },
    permission: { label: 'Permisos del Sistema', icon: 'fa-shield-halved', colorClass: 'text-purple-700 bg-purple-50 border-purple-200' },
    permiso: { label: 'Permisos del Sistema', icon: 'fa-shield-halved', colorClass: 'text-purple-700 bg-purple-50 border-purple-200' },
    proveedor: { label: 'Proveedores', icon: 'fa-handshake', colorClass: 'text-orange-700 bg-orange-50 border-orange-200' },
    proveedor_contacto: { label: 'Contacto de Proveedor', icon: 'fa-address-card', colorClass: 'text-orange-700 bg-orange-50 border-orange-200' },
    sucursal: { label: 'Sucursales', icon: 'fa-location-dot', colorClass: 'text-rose-700 bg-rose-50 border-rose-200' },
    counter: { label: 'Counters / Asesores', icon: 'fa-headset', colorClass: 'text-sky-700 bg-sky-50 border-sky-200' },
    exchange: { label: 'Tipo de Cambio', icon: 'fa-money-bill-transfer', colorClass: 'text-green-700 bg-green-50 border-green-200' },
    producto: { label: 'Productos / Paquetes', icon: 'fa-box-archive', colorClass: 'text-slate-700 bg-slate-100 border-slate-300' },
    categoria: { label: 'Categorías', icon: 'fa-tags', colorClass: 'text-slate-700 bg-slate-100 border-slate-300' },
    categoria_persona: { label: 'Categoría de Clientes', icon: 'fa-id-badge', colorClass: 'text-slate-700 bg-slate-100 border-slate-300' },
    auditoria: { label: 'Auditoría Maestra', icon: 'fa-shield', colorClass: 'text-slate-700 bg-slate-100 border-slate-300' }
  };

  // Diccionario de traducción de campos técnicos a español legible
  private readonly fieldDictionary: Record<string, string> = {
    // Identificadores y sistema
    id: 'ID del Registro',
    creado: 'Fecha de Registro',
    actualizado: 'Fecha de Actualización',
    modificado: 'Fecha de Modificación',
    activo: 'Estado Activo',
    estado: 'Estado',
    status: 'Estado',
    version: 'Versión',
    codigo: 'Código',
    descripcion: 'Descripción',
    observacion: 'Observaciones',
    observaciones: 'Observaciones',
    nota: 'Notas',
    tipo: 'Tipo',
    categoria: 'Categoría',

    // Personas y datos personales
    documento: 'N° Documento / DNI',
    numerodocumento: 'N° Documento',
    tipodocumento: 'Tipo de Documento',
    doc: 'N° Documento / DNI',
    nombres: 'Nombres',
    nomb: 'Nombres',
    apellidos: 'Apellidos',
    apell: 'Apellidos',
    apellidopaterno: 'Apellido Paterno',
    apellidomaterno: 'Apellido Materno',
    apellidospaterno: 'Apellido Paterno',
    apellidosmaterno: 'Apellido Materno',
    apellpat: 'Apellido Paterno',
    apellmat: 'Apellido Materno',
    sexo: 'Género / Sexo',
    genero: 'Género / Sexo',
    fechanacimiento: 'Fecha de Nacimiento',
    nacionalidad: 'Nacionalidad',
    pasaporte: 'N° Pasaporte',
    razonsocial: 'Razón Social',
    razsoc: 'Razón Social',
    nombrecomercial: 'Nombre Comercial',
    ruc: 'RUC',
    condicion: 'Condición SUNAT',
    direccionfiscal: 'Dirección Fiscal',

    // Contacto y ubicación
    telefono: 'Teléfono',
    celular: 'Celular',
    email: 'Correo Electrónico',
    correo: 'Correo Electrónico',
    direccion: 'Dirección',
    ciudad: 'Ciudad',
    distrito: 'Distrito',
    departamento: 'Departamento',
    pais: 'País',

    // Cotizaciones y ventas
    fechacotizacion: 'Fecha de Cotización',
    fechaviaje: 'Fecha de Viaje',
    fecvia: 'Fecha de Viaje',
    fechasalida: 'Fecha de Salida',
    fecharetorno: 'Fecha de Retorno',
    fechallegada: 'Fecha de Llegada',
    fechaemision: 'Fecha de Emisión',
    fechalimite: 'Fecha Límite',
    origen: 'Ciudad de Origen',
    destino: 'Ciudad de Destino',
    ruta: 'Ruta / Itinerario',
    itinerario: 'Itinerario de Vuelo',
    aerolinea: 'Aerolínea',
    vuelo: 'N° de Vuelo',
    clase: 'Clase / Cabina',
    pasajeros: 'Cantidad de Pasajeros',
    hotel: 'Hotel / Alojamiento',
    habitacion: 'Tipo de Habitación',
    noches: 'Noches de Estadía',

    // Importes y finanzas
    total: 'Importe Total',
    montototal: 'Monto Total',
    subtotal: 'Subtotal',
    igv: 'IGV (18%)',
    impuesto: 'Impuestos / Tasas',
    descuento: 'Descuento',
    monto: 'Monto',
    tarifa: 'Tarifa Base',
    tarifaneta: 'Tarifa Neta',
    precio: 'Precio de Venta',
    precioventa: 'Precio de Venta',
    utilidad: 'Margen / Utilidad',
    comision: 'Comisión de Agencia',
    moneda: 'Moneda (USD / PEN)',
    tipocambio: 'Tipo de Cambio Aplicado',
    formapago: 'Forma de Pago',
    metodopago: 'Método de Pago',
    saldopendiente: 'Saldo Pendiente',
    pagado: 'Monto Pagado',

    // Usuarios y seguridad
    username: 'Nombre de Usuario',
    usuario: 'Usuario Responsable',
    rol: 'Rol Asignado',
    role: 'Rol Asignado',
    roles: 'Roles Asignados',
    permisos: 'Permisos',
    sucursal: 'Sucursal',
    counter: 'Asesor / Counter',
    bloqueado: 'Cuenta Bloqueada',
    ultimologin: 'Último Acceso',
    password: 'Contraseña (Protegida)'
  };

  ngOnInit(): void {
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/audit');
    this.cargarTablas();
    this.cargarEstadisticas();
    this.cargarAuditorias();
  }

  // Manejo de Sidebar
  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: ExtendedSidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  // Carga de datos
  cargarAuditorias(): void {
    this.loading = true;

    const filters: AuditoriaFilterParams = {
      page: this.currentPage,
      size: this.pageSize
    };

    if (this.searchTerm.trim()) filters.search = this.searchTerm.trim();
    if (this.selectedTabla) filters.tabla = this.selectedTabla;
    if (this.selectedAccion) filters.accion = this.selectedAccion;
    if (this.fechaInicio) filters.fechaInicio = `${this.fechaInicio}T00:00:00`;
    if (this.fechaFin) filters.fechaFin = `${this.fechaFin}T23:59:59`;

    this.auditoriaService.getAuditorias(filters).subscribe({
      next: (res) => {
        this.auditorias = res.content || [];
        this.totalElements = res.totalElements || 0;
        this.totalPages = res.totalPages || 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar logs de auditoría:', err);
        this.loading = false;
      }
    });
  }

  cargarTablas(): void {
    this.auditoriaService.getTablas().subscribe({
      next: (tablas) => {
        this.tablasDisponibles = tablas || [];
      },
      error: (err) => console.error('Error al cargar tablas:', err)
    });
  }

  cargarEstadisticas(): void {
    this.auditoriaService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (err) => console.error('Error al cargar estadísticas:', err)
    });
  }

  // Filtros y acciones
  aplicarFiltros(): void {
    this.currentPage = 0;
    this.cargarAuditorias();
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.selectedTabla = '';
    this.selectedAccion = '';
    this.fechaInicio = '';
    this.fechaFin = '';
    this.currentPage = 0;
    this.cargarAuditorias();
  }

  cambiarPagina(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.cargarAuditorias();
    }
  }

  // Ver Detalle / Modal
  abrirDetalle(item: AuditoriaItem): void {
    this.modalAbierto = true;
    this.loadingModal = true;
    this.activeModalTab = 'cambios';
    this.modoVistaSnapshot = 'amigable';
    this.filtroCampos = '';
    this.copiadoJson = false;
    this.parsedDiffList = [];
    this.propiedadesPrevias = [];
    this.propiedadesNuevas = [];
    this.propiedadesCreadas = [];
    this.propiedadesEliminadas = [];
    this.resumenEvento = null;
    this.detalleSeleccionado = null;

    this.auditoriaService.getDetalle(item.id).subscribe({
      next: (detalle) => {
        this.detalleSeleccionado = detalle;
        this.parsearDiff(detalle.cambiosDiff, detalle.accion, detalle.datosPrevios, detalle.datosNuevos);
        this.propiedadesPrevias = this.parsearPropiedades(detalle.datosPrevios);
        this.propiedadesNuevas = this.parsearPropiedades(detalle.datosNuevos);
        this.loadingModal = false;
      },
      error: (err) => {
        console.error('Error al obtener detalle de auditoría:', err);
        this.loadingModal = false;
      }
    });
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.detalleSeleccionado = null;
    this.parsedDiffList = [];
    this.propiedadesPrevias = [];
    this.propiedadesNuevas = [];
    this.propiedadesCreadas = [];
    this.propiedadesEliminadas = [];
    this.resumenEvento = null;
    this.filtroCampos = '';
  }

  // =========================================================================
  // PARSING Y HUMANIZACIÓN DE DATOS
  // =========================================================================

  private parsearDiff(
    diffStr?: string, 
    accion?: string, 
    datosPrevios?: string, 
    datosNuevos?: string
  ): void {
    this.parsedDiffList = [];
    this.propiedadesCreadas = [];
    this.propiedadesEliminadas = [];

    const accionUpper = (accion || '').toUpperCase();

    // Caso 1: CREACIÓN
    if (accionUpper === 'CREACION') {
      const fuente = datosNuevos || diffStr;
      this.propiedadesCreadas = this.parsearPropiedades(fuente);
      this.resumenEvento = {
        titulo: 'Nuevo Registro Creado',
        descripcion: `Se creó exitosamente este registro con ${this.propiedadesCreadas.length} dato(s) iniciales en el sistema.`,
        totalCambios: this.propiedadesCreadas.length,
        esCreacion: true,
        esEliminacion: false,
        esModificacion: false,
        esConsulta: false
      };
      return;
    }

    // Caso 2: ELIMINACIÓN
    if (accionUpper === 'ELIMINACION') {
      const fuente = datosPrevios || diffStr;
      this.propiedadesEliminadas = this.parsearPropiedades(fuente);
      this.resumenEvento = {
        titulo: 'Registro Dado de Baja / Eliminado',
        descripcion: 'El registro fue retirado del sistema. Se conserva la información previa registrada para auditoría legal.',
        totalCambios: this.propiedadesEliminadas.length,
        esCreacion: false,
        esEliminacion: true,
        esModificacion: false,
        esConsulta: false
      };
      return;
    }

    // Caso 3: CONSULTA
    if (accionUpper === 'CONSULTA') {
      this.resumenEvento = {
        titulo: 'Acceso de Lectura / Consulta',
        descripcion: diffStr || 'El usuario consultó los datos de este registro en el sistema.',
        totalCambios: 0,
        esCreacion: false,
        esEliminacion: false,
        esModificacion: false,
        esConsulta: true
      };
      return;
    }

    // Caso 4: MODIFICACIÓN (o genérico)
    let diffParsed = false;
    if (diffStr) {
      try {
        const obj = JSON.parse(diffStr);
        for (const key of Object.keys(obj)) {
          const val = obj[key];
          if (val && typeof val === 'object' && ('antes' in val || 'ahora' in val)) {
            const antesFmt = this.formatValueHuman(val.antes, key);
            const ahoraFmt = this.formatValueHuman(val.ahora, key);
            this.parsedDiffList.push({
              campoOriginal: key,
              campoLegible: this.humanizeKey(key),
              antes: val.antes,
              ahora: val.ahora,
              antesFormateado: antesFmt.formatted,
              ahoraFormateado: ahoraFmt.formatted,
              tipo: (ahoraFmt.tipo !== 'vacio' ? ahoraFmt.tipo : antesFmt.tipo)
            });
            diffParsed = true;
          }
        }
      } catch {}
    }

    // Fallback si diffStr no tenía estructura {antes, ahora}, comparar datosPrevios y datosNuevos
    if (!diffParsed && datosPrevios && datosNuevos) {
      try {
        const prevObj = JSON.parse(datosPrevios);
        const newObj = JSON.parse(datosNuevos);
        const allKeys = Array.from(new Set([...Object.keys(prevObj), ...Object.keys(newObj)]));
        for (const key of allKeys) {
          const valPrev = prevObj[key];
          const valNew = newObj[key];
          if (JSON.stringify(valPrev) !== JSON.stringify(valNew)) {
            const antesFmt = this.formatValueHuman(valPrev, key);
            const ahoraFmt = this.formatValueHuman(valNew, key);
            this.parsedDiffList.push({
              campoOriginal: key,
              campoLegible: this.humanizeKey(key),
              antes: valPrev,
              ahora: valNew,
              antesFormateado: antesFmt.formatted,
              ahoraFormateado: ahoraFmt.formatted,
              tipo: (ahoraFmt.tipo !== 'vacio' ? ahoraFmt.tipo : antesFmt.tipo)
            });
          }
        }
      } catch {}
    }

    this.resumenEvento = {
      titulo: 'Modificación de Información',
      descripcion: this.parsedDiffList.length > 0
        ? `Se detectaron ${this.parsedDiffList.length} campo(s) modificados en este registro.`
        : 'Actualización registrada en el sistema.',
      totalCambios: this.parsedDiffList.length,
      esCreacion: false,
      esEliminacion: false,
      esModificacion: true,
      esConsulta: false
    };
  }

  parsearPropiedades(jsonStr?: string): PropiedadItem[] {
    if (!jsonStr) return [];
    try {
      const obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      if (!obj || typeof obj !== 'object') return [];

      const items: PropiedadItem[] = [];
      const keys = Object.keys(obj);

      for (const key of keys) {
        if (key.startsWith('$') || key.startsWith('_hibernate')) continue;

        const rawVal = obj[key];
        const humanized = this.formatValueHuman(rawVal, key);
        const etiqueta = this.humanizeKey(key);

        items.push({
          claveOriginal: key,
          etiqueta,
          valorOriginal: rawVal,
          valorFormateado: humanized.formatted,
          tipo: humanized.tipo
        });
      }

      return items.sort((a, b) => {
        const pA = this.getFieldPriority(a.claveOriginal);
        const pB = this.getFieldPriority(b.claveOriginal);
        if (pA !== pB) return pA - pB;
        return a.etiqueta.localeCompare(b.etiqueta);
      });
    } catch {
      return [];
    }
  }

  private getFieldPriority(key: string): number {
    const k = key.toLowerCase();
    if (k === 'id' || k.endsWith('_id') || k.endsWith('_id_int')) return 1;
    if (k.includes('documento') || k.includes('doc') || k.includes('dni') || k.includes('ruc')) return 2;
    if (k.includes('nombre') || k.includes('nomb') || k.includes('razon')) return 3;
    if (k.includes('apellido') || k.includes('apell')) return 4;
    if (k.includes('total') || k.includes('monto') || k.includes('precio') || k.includes('tarifa')) return 5;
    if (k.includes('estado') || k.includes('status')) return 6;
    if (k.includes('correo') || k.includes('email') || k.includes('tel')) return 7;
    if (k.includes('fecha') || k.includes('fec')) return 8;
    return 99;
  }

  humanizeKey(rawKey: string): string {
    if (!rawKey) return '';
    const cleanKey = rawKey.trim();
    const lowerKey = cleanKey.toLowerCase();

    // 1. Diccionario directo
    if (this.fieldDictionary[lowerKey]) {
      return this.fieldDictionary[lowerKey];
    }

    // 2. Limpieza de prefijos de BD (per_nat_, cot_, etc.) y sufijos (_vac, _int, _tmp, etc.)
    const stripped = lowerKey
      .replace(/^(per_nat_|per_jur_|cot_|usr_|usu_|dtdoc_|via_|suc_|prov_|cli_|audi_|cat_|pag_|rec_|det_|tel_|cor_|dir_)/i, '')
      .replace(/(_vac|_int|_num|_tmp|_flt|_bol)$/i, '');

    const strippedNoUnderscores = stripped.replace(/_/g, '');

    if (this.fieldDictionary[stripped]) {
      return this.fieldDictionary[stripped];
    }
    if (this.fieldDictionary[strippedNoUnderscores]) {
      return this.fieldDictionary[strippedNoUnderscores];
    }

    // 3. Transformar camelCase o snake_case a Palabras Legibles
    const readable = cleanKey
      .replace(/^(per_nat_|per_jur_|cot_|usr_|usu_|dtdoc_|via_|suc_|prov_|cli_|audi_|cat_|pag_|rec_|det_|tel_|cor_|dir_)/i, '')
      .replace(/(_vac|_int|_num|_tmp|_flt|_bol)$/i, '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .trim();

    return readable
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  formatValueHuman(val: any, fieldKey?: string): { formatted: string; tipo: FormattedValueType } {
    if (val === null || val === undefined || val === '') {
      return { formatted: '— Sin valor —', tipo: 'vacio' };
    }

    if (typeof val === 'boolean') {
      return {
        formatted: val ? 'Sí (Activo)' : 'No (Inactivo)',
        tipo: 'booleano'
      };
    }

    // Detectar valores con cifrado AES-256
    if (typeof val === 'string' && val.startsWith('enc:')) {
      return {
        formatted: '🔒 Protegido / Cifrado (AES-256)',
        tipo: 'cifrado'
      };
    }

    // Detectar fechas ISO
    if (typeof val === 'string' && (
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val) ||
      /^\d{4}-\d{2}-\d{2}$/.test(val)
    )) {
      try {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          const hasTime = val.includes('T');
          return {
            formatted: d.toLocaleString('es-PE', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              ...(hasTime ? { hour: '2-digit', minute: '2-digit' } : {})
            }),
            tipo: 'fecha'
          };
        }
      } catch {}
    }

    // Detectar montos o monedas
    const keyLower = (fieldKey || '').toLowerCase();
    const isMoney = keyLower.includes('monto') || keyLower.includes('total') || 
                    keyLower.includes('precio') || keyLower.includes('tarifa') || 
                    keyLower.includes('subtotal') || keyLower.includes('igv');

    if (typeof val === 'number') {
      if (isMoney) {
        return {
          formatted: val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          tipo: 'moneda'
        };
      }
      return { formatted: String(val), tipo: 'numero' };
    }

    // Arrays
    if (Array.isArray(val)) {
      if (val.length === 0) return { formatted: 'Lista vacía (0 elementos)', tipo: 'vacio' };
      if (typeof val[0] === 'string' || typeof val[0] === 'number') {
        return { formatted: val.join(', '), tipo: 'texto' };
      }
      return { formatted: `${val.length} registro(s) asociados`, tipo: 'objeto' };
    }

    // Objetos anidados
    if (typeof val === 'object') {
      if (val.nombre || val.nombres || val.descripcion || val.razonSocial) {
        const desc = val.nombre || val.nombres || val.descripcion || val.razonSocial;
        const idPart = val.id ? ` (#${val.id})` : '';
        return { formatted: `${desc}${idPart}`, tipo: 'objeto' };
      }
      if (val.id !== undefined && Object.keys(val).length === 1) {
        return { formatted: `Registro #${val.id}`, tipo: 'objeto' };
      }
      try {
        return { formatted: JSON.stringify(val), tipo: 'objeto' };
      } catch {
        return { formatted: '[Objeto]', tipo: 'objeto' };
      }
    }

    return { formatted: String(val), tipo: 'texto' };
  }

  // =========================================================================
  // FILTRADO Y AYUDANTES DE VISTA
  // =========================================================================

  getDiffFiltrado(): ParsedDiffItem[] {
    if (!this.filtroCampos.trim()) return this.parsedDiffList;
    const q = this.filtroCampos.toLowerCase();
    return this.parsedDiffList.filter(d =>
      d.campoLegible.toLowerCase().includes(q) ||
      d.campoOriginal.toLowerCase().includes(q) ||
      d.antesFormateado.toLowerCase().includes(q) ||
      d.ahoraFormateado.toLowerCase().includes(q)
    );
  }

  getPropiedadesFiltradas(lista: PropiedadItem[]): PropiedadItem[] {
    if (!this.filtroCampos.trim()) return lista;
    const q = this.filtroCampos.toLowerCase();
    return lista.filter(p =>
      p.etiqueta.toLowerCase().includes(q) ||
      p.claveOriginal.toLowerCase().includes(q) ||
      p.valorFormateado.toLowerCase().includes(q)
    );
  }

  copiarJson(jsonStr?: string): void {
    if (!jsonStr) return;
    navigator.clipboard.writeText(this.formatJson(jsonStr)).then(() => {
      this.copiadoJson = true;
      setTimeout(() => this.copiadoJson = false, 2500);
    });
  }

  formatJson(jsonStr?: string): string {
    if (!jsonStr) return 'Sin datos registrados';
    try {
      const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonStr;
    }
  }

  getTablaInfo(tabla: string): TablaConfigItem {
    if (!tabla) return { label: 'General', icon: 'fa-cube', colorClass: 'text-slate-700 bg-slate-100 border-slate-200' };
    const key = tabla.toLowerCase().trim();
    return this.tablaConfig[key] || {
      label: this.humanizeKey(tabla),
      icon: 'fa-database',
      colorClass: 'text-slate-700 bg-slate-100 border-slate-200'
    };
  }

  getBadgeClass(accion: string): string {
    switch (accion?.toUpperCase()) {
      case 'CREACION':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'MODIFICACION':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ELIMINACION':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'CONSULTA':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  }

  getAccionIcon(accion: string): string {
    switch (accion?.toUpperCase()) {
      case 'CREACION':
        return 'fa-plus-circle text-emerald-600';
      case 'MODIFICACION':
        return 'fa-pen-to-square text-blue-600';
      case 'ELIMINACION':
        return 'fa-trash-can text-rose-600';
      case 'CONSULTA':
        return 'fa-eye text-purple-600';
      default:
        return 'fa-circle-info text-slate-600';
    }
  }

  calcularResumenFila(item: AuditoriaItem): string {
    const accion = item.accion?.toUpperCase();
    if (accion === 'CREACION') return 'Nuevo registro creado';
    if (accion === 'ELIMINACION') return 'Registro dado de baja';
    if (accion === 'CONSULTA') return 'Consulta de información';
    if (accion === 'MODIFICACION') {
      return item.tieneDiff ? 'Actualización de datos' : 'Modificación registrada';
    }
    return 'Operación realizada';
  }

  parseUserAgent(ua?: string): string {
    if (!ua) return 'No identificado';
    if (ua.includes('Postman')) return 'Postman API Client';
    
    let browser = 'Navegador Web';
    if (ua.includes('Edg/')) browser = 'Microsoft Edge';
    else if (ua.includes('Chrome/')) browser = 'Google Chrome';
    else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Apple Safari';

    let os = '';
    if (ua.includes('Windows NT 10.0')) os = ' (Windows 10/11)';
    else if (ua.includes('Windows')) os = ' (Windows)';
    else if (ua.includes('Macintosh')) os = ' (macOS)';
    else if (ua.includes('Android')) os = ' (Android)';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = ' (iOS)';
    else if (ua.includes('Linux')) os = ' (Linux)';

    return `${browser}${os}`;
  }

  formatFecha(fechaStr: string): string {
    if (!fechaStr) return '-';
    try {
      const date = new Date(fechaStr);
      return date.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return fechaStr;
    }
  }
}
