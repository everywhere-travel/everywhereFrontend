import { CounterResponse } from '../Counter/counter.model'
import { FormaPagoResponse} from '../FormaPago/formaPago.model'
import { EstadoCotizacionResponse } from './estadoCotizacion.model'
import { SucursalResponse } from '../Sucursal/sucursal.model'
import { CarpetaResponse } from '../Carpeta/carpeta.model'
import { PersonaResponse } from '../Persona/persona.model'

export interface CotizacionRequest {
  cantAdultos?: number
  cantNinos?: number
  fechaVencimiento?: string
  origenDestino?: string
  fechaSalida?: string
  fechaRegreso?: string
  moneda?: string
  observacion?: string
}

export interface CotizacionResponse {
  id: number
  codigoCotizacion?: string
  cantAdultos?: number
  cantNinos?: number
  fechaEmision?: string
  fechaVencimiento?: string
  actualizado?: string
  origenDestino?: string
  fechaSalida?: string
  fechaRegreso?: string
  moneda?: string
  observacion?: string
  counter?: CounterResponse
  estadoCotizacion?: EstadoCotizacionResponse
  sucursal?: SucursalResponse
  carpeta?: CarpetaResponse
  persona?: PersonaResponse
  formaPago?: FormaPagoResponse

}
