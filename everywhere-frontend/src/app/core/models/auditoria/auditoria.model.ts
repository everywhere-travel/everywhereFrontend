export interface AuditoriaItem {
  id: number;
  tabla: string;
  registroId: string;
  accion: 'CREACION' | 'MODIFICACION' | 'ELIMINACION' | 'CONSULTA' | string;
  usuarioId?: number;
  username?: string;
  usuarioNombre?: string;
  ipOrigen?: string;
  endpoint?: string;
  fechaHora: string;
  tieneDiff: boolean;
}

export interface AuditoriaDetalle {
  id: number;
  tabla: string;
  registroId: string;
  accion: string;
  usuarioId?: number;
  username?: string;
  usuarioNombre?: string;
  datosPrevios?: string;
  datosNuevos?: string;
  cambiosDiff?: string;
  ipOrigen?: string;
  endpoint?: string;
  userAgent?: string;
  fechaHora: string;
}

export interface AuditoriaStats {
  totalEventos: number;
  eventosHoy: number;
  creaciones: number;
  modificaciones: number;
  eliminaciones: number;
  consultas: number;
}

export interface AuditoriaPageResponse {
  content: AuditoriaItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
