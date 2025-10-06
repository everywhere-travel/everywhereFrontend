export interface CounterRequest {
  nombre?: string
  codigo?: string
}

export interface CounterResponse {
  id: number
  nombre?: string
  estado?: boolean
  codigo?: string
  fechaCreacion?: string
  fechaActualizacion?: string
}
