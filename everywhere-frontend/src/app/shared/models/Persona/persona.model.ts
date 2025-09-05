export interface PersonaRequest {
  email?: string
  telefono?: string
  direccion?: string
  observacion?: string
}

export interface PersonaResponse {
  id: number
  email?: string
  telefono?: string
  direccion?: string
  observacion?: string
  creado: string
  actualizado: string
}

