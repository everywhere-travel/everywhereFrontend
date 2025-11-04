import { TelefonoPersonaResponse } from '../TelefonoPersona/telefonoPersona.models';
import { CorreoPersonaResponse } from '../CorreoPersona/correoPersona.model';

export interface PersonaRequest {
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
  telefonos?: TelefonoPersonaResponse[]
  correos?: CorreoPersonaResponse[]
}

export interface personaDisplay {
  id: number;
  tipo: string;
  identificador: string;
  nombre: string;
}
