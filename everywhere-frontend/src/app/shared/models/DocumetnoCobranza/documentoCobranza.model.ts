// Modelo para el detalle del documento de cobranza (básico)
export interface DetalleDocumentoCobranza {
  cantidad: number;
  codigoProducto: string;
  descripcion: string;
  precioUnitario: number;
  total?: number;
  nombreProducto?: string;
}

// Modelo principal para el documento de cobranza (DTO)
export interface DocumentoCobranzaDTO {
  // Campos manuales
  fileVenta?: string;
  costoEnvio?: number;

  // Campos de cotización
  codigoCotizacion?: string;   // Número de cotización
  fechaEmision?: string; // ISO string format for LocalDateTime
  clienteNombre?: string;      // Nombre completo del cliente
  clienteTelefono?: string;
  clienteDocumento?: string;   // DNI o RUC del cliente
  clienteDireccion?: string;   // Dirección del cliente
  sucursalDescripcion?: string;
  puntoCompra?: string;
  moneda?: string;
  formaPago?: string;
  observaciones?: string;

  // Totales
  subtotal?: number;
  total?: number;
  importeEnLetras?: string;

  // Detalles
  detalles?: DetalleDocumentoCobranza[];
}

// Modelo para la respuesta de listado de documentos (ResponseDTO)
export interface DocumentoCobranzaResponseDTO {
  id?: number;
  numero?: string;
  fechaEmision?: string; // ISO string format for LocalDateTime
  observaciones?: string;
  fileVenta?: string;
  costoEnvio?: number;
  moneda?: string;
  total?: number;  // Total del documento

  // Información de relaciones
  cotizacionId?: number;
  codigoCotizacion?: string;  // Número de cotización
  personaId?: number;
  sucursalId?: number;
  formaPagoId?: number;

  // Información básica para mostrar
  clienteNombre?: string;     // Nombre de la persona
  sucursalDescripcion?: string;
  formaPagoDescripcion?: string;
}

// DTO para actualización de documento de cobranza (equivalente a DocumentoCobranzaUpdateDTO)
export interface DocumentoCobranzaUpdateDTO {
  fileVenta?: string;
  costoEnvio?: number;
  observaciones?: string;
}
