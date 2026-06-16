import { DetalleReciboResponseDTO } from "./detalleRecibo.model";

// Modelo para la respuesta de listado de recibos (ResponseDTO)
export interface ReciboResponseDTO {
  id?: number;
  serie?: string;
  correlativo?: number;
  fechaEmision?: string;
  observaciones?: string;
  fechaVencimiento?: string;
  fileVenta?: string;
  moneda?: string;

  documentoCobranzaId?: number;
  documentoCobranzaNumero?: string;

  cotizacionId?: number;
  codigoCotizacion?: string;
  personaId?: number;
  sucursalId?: number;
  formaPagoId?: number;
  detalleDocumentoId?: number;

  clienteNombre?: string;
  clienteDocumento?: string;
  tipoDocumentoCliente?: string;
  sucursalDescripcion?: string;
  formaPagoDescripcion?: string;

  carpetaId?: number;
  carpetaNombre?: string;

  personaJuridicaId?: number;
  personaJuridicaRuc?: string;
  personaJuridicaRazonSocial?: string;

  createdAt?: string;
  updatedAt?: string;

  detalles?: DetalleReciboResponseDTO[];
}

// DTO para actualización de recibo
export interface ReciboUpdateDTO {
  fechaEmision?: string; // ISO string format
  fileVenta?: string;
  observaciones?: string;
  fechaVencimiento?: string; // ISO string format
  detalleDocumentoId?: number;
  sucursalId?: number;
  personaJuridicaId?: number;
  formaPagoId?: number;
}
