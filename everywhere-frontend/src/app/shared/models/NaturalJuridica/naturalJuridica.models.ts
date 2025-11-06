import { PersonaJuridicaResponse } from "../Persona/personaJuridica.models";
import { PersonaNaturalResponse } from "../Persona/personaNatural.model";

export interface NaturalJuridicaRequest {
  personaNaturalId: number;
  personasJuridicasIds:  number[];
}

export interface NaturalJuridicaResponse {
  id: number;
  personaNatural: PersonaNaturalResponse
  personaJuridica: PersonaJuridicaResponse
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface NaturalJuridicoPatch {
  agregar?: number[];
  eliminar?: number[];
}
