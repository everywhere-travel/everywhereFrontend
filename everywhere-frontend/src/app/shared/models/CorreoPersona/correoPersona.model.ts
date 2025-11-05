export interface CorreoPersonaRequest {
  email: string
  tipo: string
}

export interface CorreoPersonaResponse {
  id: number
  email: string
  tipo: string
  creado: string
  actualizado: string
}
