import { CounterResponse } from '../Counter/counter.model'
import { FormaPagoResponse} from '../FormaPago/formaPago.model'
import { EstadoCotizacionResponse } from './estadoCotizacion.model'
import { SucursalResponse } from '../Sucursal/sucursal.model'
import { CarpetaResponse } from '../Carpeta/carpeta.model'
import { PersonaResponse } from '../Persona/persona.model'
import { DetalleCotizacionSimpleDTO } from '../Cotizacion/detalleCotizacion.model'

/**
 * DTO para crear o actualizar cotizaciones
 * Todos los campos son opcionales ya que usamos PATCH para actualizaciones
 */
export interface CotizacionRequest {
  cantAdultos?: number
  cantNinos?: number
  fechaVencimiento?: string
  origenDestino?: string
  fechaSalida?: string
  fechaRegreso?: string
  moneda?: string
  observacion?: string
  counterId?: number
  formaPagoId?: number
  estadoCotizacionId?: number
  sucursalId?: number
  carpetaId?: number
}

export type CotizacionPatchRequest = Partial<CotizacionRequest>

export interface CotizacionResponse {
  id: number
  codigoCotizacion: string
  cantAdultos: number
  cantNinos: number
  fechaEmision: string
  fechaVencimiento: string
  actualizado: string
  origenDestino: string
  fechaSalida: string
  fechaRegreso: string
  moneda: string
  observacion?: string
  grupoSeleccionadoId?: number

  counter?: CounterResponse
  formaPago?: FormaPagoResponse
  estadoCotizacion?: EstadoCotizacionResponse
  sucursal?: SucursalResponse
  carpeta?: CarpetaResponse
  personas?: PersonaResponse
}

export interface CotizacionConDetallesResponseDTO {
  id: number
  codigoCotizacion: string
  cantAdultos: number
  cantNinos: number
  fechaEmision: string
  fechaVencimiento: string
  actualizado: string
  origenDestino: string
  fechaSalida: string
  fechaRegreso: string
  moneda: string
  observacion?: string
  grupoSeleccionadoId?: number

  // Relaciones de la cotización
  counter?: CounterResponse
  formaPago?: FormaPagoResponse
  estadoCotizacion?: EstadoCotizacionResponse
  sucursal?: SucursalResponse
  carpeta?: CarpetaResponse
  personas?: PersonaResponse

  // Lista de detalles anidados (sin la cotización repetida)
  detalles: DetalleCotizacionSimpleDTO[]
}
