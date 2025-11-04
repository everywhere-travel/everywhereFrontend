
export interface ProveedorRequest {
  nombre: string;
}

export interface ProveedorResponse {
  id: number;
  nombre: string;
  nombreJuridico?: string;
  ruc?: number;
  creado: string;
  actualizado: string;
}
