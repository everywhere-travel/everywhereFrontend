import { PersonaResponse } from "../Persona/persona.model";
import { PersonaNaturalSinViajero } from "../Persona/personaNatural.model";

export interface ViajeroRequest {
  fechaNacimiento?: string;
  nacionalidad?: string;
  residencia?: string;
  personaId: number;
}

export interface ViajeroResponse {
  id: number;
  fechaNacimiento?: string;
  nacionalidad?: string;
  residencia?: string;
  creado: string;
  actualizado: string;
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
