import { ViajeroResponse } from '../Viajero/viajero.model';
import { DocumentoResponse } from './documento.model';

export interface DetalleDocumentoRequest {
  numero: string;
  fechaEmision: string;
  fechaVencimiento: string;
  origen: string;
  documentoId: number;
  viajeroId: number;
}

export interface DetalleDocumentoResponse {
  id: number;
  numero: string;
  fechaEmision: string;
  fechaVencimiento: string;
  origen: string;
  documento: DocumentoResponse;
  viajero: ViajeroResponse;
}
