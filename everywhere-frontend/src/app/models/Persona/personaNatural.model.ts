import { PersonaRequest, PersonaResponse } from './persona.model'

export interface PersonaNaturalRequest {
  documento?: string
  nombres?: string
  apellidos?: string
  cliente?: boolean
  categoria?: string
  persona?: PersonaRequest
}

export interface PersonaNaturalResponse {
  id: number
  documento?: string
  nombres?: string
  apellidos?: string
  cliente?: boolean
  categoria?: string
  creado?: string
  actualizado?: string
  persona?: PersonaResponse
}
