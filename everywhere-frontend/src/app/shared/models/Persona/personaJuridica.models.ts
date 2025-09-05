import { PersonaRequest, PersonaResponse } from './persona.model'

export interface PersonaJuridicaRequest {
  documento?: string
  nombres?: string
  apellidos?: string
  cliente?: boolean
  categoria?: string
  persona?: PersonaRequest
}

export interface PersonaJuridicaResponse {
  id: number
  ruc?: string
  razonSocial?: string
  creado: string
  actualizado: string
  persona?: PersonaResponse
}
