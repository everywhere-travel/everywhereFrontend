import { ViajeroResponse } from './viajero.model';

export interface ViajeroFrecuenteRequest {
  areolinea: string;
  codigo: string;
}

export interface ViajeroFrecuenteResponse {
  id: number;
  areolinea: string;
  codigo: string;
  viajero: ViajeroResponse;
  creado: string;
  actualizado: string;
}
