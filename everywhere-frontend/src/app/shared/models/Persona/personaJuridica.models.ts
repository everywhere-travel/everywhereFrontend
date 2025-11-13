import { PersonaRequest, PersonaResponse } from './persona.model'

export interface PersonaJuridicaRequest {
  ruc?: string
  razonSocial?: string
  persona?: PersonaRequest
}

export interface PersonaJuridicaResponse {
  id: number
  ruc?: string
  razonSocial?: string
  creado: string
  actualizado: string
  persona: PersonaResponse
}
