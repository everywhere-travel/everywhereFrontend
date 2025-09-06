export interface FormaPagoResponse {
  id: number
  codigo?: number
  descripcion?: string
  fechaCreacion?: string
  fechaActualizacion?: string
}

export interface FormaPagoRequest {
  codigo?: number
  descripcion?: string
}
