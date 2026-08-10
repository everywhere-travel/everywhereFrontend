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

export interface CarpetaItemDTO {
  id: number
  tipo: 'cotizacion' | 'liquidacion' | 'recibo' | 'documento-cobranza'
  numero: string
  fecha?: string
  descripcion?: string
}

export interface CarpetaContenidoDTO {
  carpeta: CarpetaResponse
  contenido: CarpetaItemDTO[]
}
