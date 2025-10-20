import { PersonaRequest, PersonaResponse } from '../Persona/persona.model';

export interface ViajeroRequest {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  nacionalidad: string;
  residencia: string;
  persona: PersonaRequest;
}

export interface ViajeroResponse {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  nacionalidad: string;
  residencia: string;
  creado: string;
  actualizado: string;
  persona: PersonaResponse;
}
