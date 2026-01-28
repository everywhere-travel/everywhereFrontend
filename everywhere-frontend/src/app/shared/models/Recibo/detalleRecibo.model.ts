// Modelo para el detalle del recibo (ResponseDTO)
export interface DetalleReciboResponseDTO {
  id?: number;
  cantidad?: number;
  descripcion?: string;
  precio?: number;
  productoId?: number;
  productoDescripcion?: string;
  reciboId?: number;
  reciboNumero?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

// DTO para crear/actualizar detalle de recibo
export interface DetalleReciboRequestDTO {
  cantidad?: number;
  descripcion?: string;
  precio?: number;
  reciboId?: number;
  productoId?: number;
}
