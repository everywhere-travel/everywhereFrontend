import { PersonaNaturalResponse } from '../Persona/personaNatural.model';
import { ViajeroResponse } from '../Viajero/viajero.model';
import { DocumentoResponse } from './documento.model';

export interface DetalleDocumentoRequest {
  numero: string
  fechaEmision?: string
  fechaVencimiento?: string
  origen: string
  documentoId: number
  personaNaturalId: number
}

export interface DetalleDocumentoResponse {
  id: number
  numero: string
  fechaEmision?: string
  fechaVencimiento?: string
  origen: string
  creado: string
  actualizado: string
  documento: DocumentoResponse
  personaNatural: PersonaNaturalResponse
}

export interface PersonaInfo {
  personaId: number;
  nombreCompleto: string;
}

export interface DetalleDocumentoConPersonasDto {
  numeroDocumento: string;
  tipoDocumento: string;
  personas: PersonaInfo[];
}
