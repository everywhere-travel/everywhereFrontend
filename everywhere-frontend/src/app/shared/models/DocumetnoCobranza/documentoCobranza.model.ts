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
  // Unique identifier
  id?: number;

  // Campos manuales
  nroSerie?: string;
  fileVenta?: string;
  costoEnvio?: number;

  // Campos de cotización
  fechaEmision?: string; // ISO string format for LocalDateTime
  clienteEmail?: string;
  clienteTelefono?: string;
  clienteNombre?: string;      // Nombre completo del cliente
  clienteDocumento?: string;   // DNI o RUC del cliente
  sucursalDescripcion?: string;
  puntoCompra?: string;
  moneda?: string;
  formaPago?: string;
  observaciones?: string;

  // Totales
  subtotal?: number;
  igv?: number;
  total?: number;
  importeEnLetras?: string;

  // Campos de la cotización asociada
  codigoCotizacion?: string;
  cantAdultos?: number;
  cantNinos?: number;
  origenDestino?: string;
  fechaSalida?: string;
  fechaRegreso?: string;
  fechaVencimiento?: string;
  actualizado?: string;
  grupoSeleccionadoId?: number;

  // Detalles
  detalles?: DetalleDocumentoCobranza[];
}
