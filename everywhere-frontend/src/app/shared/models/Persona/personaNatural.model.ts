import { CategoriaPersonaResponse } from '../CategoriaPersona/categoriaPersona.models'
import { ViajeroResponse } from '../Viajero/viajero.model'
import { PersonaRequest, PersonaResponse } from './persona.model'

export interface PersonaNaturalRequest {
  documento?: string
  nombres?: string
  apellidosPaterno?: string
  apellidosMaterno?: string
  sexo?: string
  viajeroId?: number
  categoriaPersonaId?: number
  persona?: PersonaRequest
}

export interface PersonaNaturalResponse {
  id: number
  documento?: string
  nombres?: string
  apellidosPaterno?: string
  apellidosMaterno?: string
  sexo?: string
  creado: string
  actualizado: string
  persona: PersonaResponse
  viajero?: ViajeroResponse
  categoriaPersona?: CategoriaPersonaResponse
}

export interface PersonaNaturalViajero{
  viajeroId?: number;
}

export interface PersonaNaturalCategoria{
  categoriaId?: number;
}

export interface PersonaNaturalSinViajero {
  id: number
  documento?: string
  nombres?: string
  apellidosPaterno?: string
  apellidosMaterno?: string
  sexo?: string
  creado: string
  actualizado: string
  persona?: PersonaResponse
  categoriaPersona?: CategoriaPersonaResponse
}
