export interface EstadoCotizacionResponse {
  id: number
  descripcion?: string
  fechaCreacion:string
  fechaActualizacion: string
}

export interface EstadoCotizacionRequest {
  descripcion?: string
}
