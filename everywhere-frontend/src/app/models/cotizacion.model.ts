export interface Cotizacion {
  id?: number
  numero: string
  fechaCotizacion: Date
  fechaViaje?: Date
  fechaRetorno?: Date
  personaId: number
  numeroAdultos: number
  numeroNinos: number
  moneda: string
  tipoCambio: number
  formaPago: string
  estado: string
  observaciones?: string
  subtotal: number
  impuestos: number
  total: number
  fechaCreacion?: Date
  fechaActualizacion?: Date
  detalles?: DetalleCotizacion[]

}

export interface DetalleCotizacion {
  id?: number
  cotizacionId: number
  productoId: number
  cantidad: number
  precioUnitario: number
  subtotal: number
observaciones?: string
}

export interface GrupoHotel {
  id?: number
  nombre: string
  hoteles: Hotel[]
  seleccionado?: boolean
}

export interface Hotel {
  id?: number
  nombre: string
  categoria: number
  ubicacion: string
  precioNoche: number
  grupoId?: number
  seleccionado?: boolean
}
