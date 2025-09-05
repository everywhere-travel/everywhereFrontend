export interface CarpetaRequest {
  nombre?: string
  descripcion?: string
}

export interface CarpetaResponse {
  id: number
  nombre?: string
  descripcion?: string
  creado: string
  actualizado: string
  nivel: number
  carpetaPadreId?: number
}
