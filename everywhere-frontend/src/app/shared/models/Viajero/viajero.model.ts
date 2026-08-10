import { PersonaResponse } from "../Persona/persona.model";
import { PersonaNaturalSinViajero, PersonaNaturalSinViajeroResponse } from "../Persona/personaNatural.model";

export interface ViajeroRequest {
  fechaNacimiento?: string;
  nacionalidad?: string;
  residencia?: string;
  personaNaturalId: number;
}

export interface PersonaNaturalResumen {
  id: number;
  nombres?: string;
  apellidosPaterno?: string;
  apellidosMaterno?: string;
  documento?: string;
}

export interface ViajeroResponse {
  id: number;
  fechaNacimiento?: string;
  nacionalidad?: string;
  residencia?: string;
  creado: string;
  actualizado: string;
  personaNatural?: PersonaNaturalResumen;
}

export interface ViajeroConPersonaNatural {
  id: number;
  fechaNacimiento?: string;
  nacionalidad?: string;
  residencia?: string;
  creado?: string;
  actualizado?: string;
  personaNatural?: PersonaNaturalSinViajero
}

export interface ViajeroConPersonaResponse {
  id: number;
  fechaNacimiento?: string;
  nacionalidad?: string;
  residencia?: string;
  creado: string;
  actualizado: string;
  personaNatural: PersonaNaturalSinViajeroResponse;
}
