// Modelo para respuesta de detalle de documento de cobranza (equivalente a DetalleDocumentoCobranzaResponseDTO)
export interface DetalleDocumentoCobranzaResponseDTO {
  id?: number;
  cantidad?: number;
  descripcion?: string;
  precio?: number;
  fechaCreacion?: string; // ISO string format for LocalDateTime

  // IDs de relaciones para evitar lazy loading
  documentoCobranzaId?: number;
  documentoCobranzaNumero?: string;

  productoId?: number;
  productoDescripcion?: string;
}

// Modelo para request de detalle de documento de cobranza (equivalente a DetalleDocumentoCobranzaRequestDTO)
export interface DetalleDocumentoCobranzaRequestDTO {
  cantidad?: number; // @Positive validation should be handled in the component
  descripcion?: string;
  precio?: number; // @Positive validation should be handled in the component
  documentoCobranzaId?: number;
  productoId?: number;
}
