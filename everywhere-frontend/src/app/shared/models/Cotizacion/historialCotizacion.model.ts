export interface HistorialCotizacionRequest {
  observacion?: string;
  usuarioId?: number;
  cotizacionId?: number;
  estadoCotizacionId?: number;
}

export interface HistorialCotizacionResponse {
  id: number;
  uuid?: string;
  observacion?: string;
  fechaCreacion?: string;

  usuarioId?: number;
  usuarioNombre?: string;
  usuarioEmail?: string;

  cotizacionId?: number;
  codigoCotizacion?: string;

  estadoCotizacionId?: number;
  estadoCotizacionDescripcion?: string;
}

export interface HistorialCotizacionSimple {
  id: number;
  uuid?: string;
  observacion?: string;
  fechaCreacion?: string;

  usuarioId?: number;
  usuarioNombre?: string;
  usuarioEmail?: string;

  estadoCotizacionId?: number;
  estadoCotizacionDescripcion?: string;
}
