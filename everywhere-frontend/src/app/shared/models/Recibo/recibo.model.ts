// Modelo para la respuesta de listado de recibos (ResponseDTO)
export interface ReciboResponseDTO {
  id?: number;
  serie?: string;
  correlativo?: number;
  fechaEmision?: string; // ISO string format
  observaciones?: string;
  fileVenta?: string;
  moneda?: string;

  // Información de relaciones
  cotizacionId?: number;
  codigoCotizacion?: string;
  personaId?: number;
  sucursalId?: number;
  formaPagoId?: number;
  detalleDocumentoId?: number;

  // Información básica para mostrar
  clienteNombre?: string;
  clienteDocumento?: string;
  tipoDocumentoCliente?: string;
  sucursalDescripcion?: string;
  formaPagoDescripcion?: string;

  // Información de PersonaJuridica (si fue seleccionada)
  personaJuridicaId?: number;
  personaJuridicaRuc?: string;
  personaJuridicaRazonSocial?: string;

  // Campos de auditoría
  createdAt?: string;
  updatedAt?: string;

  // Detalles
  detalles?: any[];
}

// DTO para actualización de recibo
export interface ReciboUpdateDTO {
  fechaEmision?: string; // ISO string format
  fileVenta?: string;
  observaciones?: string;
  detalleDocumentoId?: number;
  sucursalId?: number;
  personaJuridicaId?: number;
  formaPagoId?: number;
}
