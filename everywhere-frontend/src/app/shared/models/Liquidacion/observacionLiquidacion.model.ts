import { LiquidacionResponse } from './liquidacion.model'
export interface ObservacionLiquidacionRequest {
  descripcion?: string
  valor?: number
  documento?: string
  numeroDocumento?: string
  liquidacionId?: number
}

export interface ObservacionLiquidacionResponse {
  id: number
  descripcion?: string
  valor?: number
  documento?: string
  numeroDocumento?: string
  creado?: string
  actualizado?: string
  liquidacion?: LiquidacionResponse
}

export interface ObservacionLiquidacionSimple {
  id: number
  descripcion?: string
  valor?: number
  documento?: string
  numeroDocumento?: string
  creado?: string
  actualizado?: string
}
