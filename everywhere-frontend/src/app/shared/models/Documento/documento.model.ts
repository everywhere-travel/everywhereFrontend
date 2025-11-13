export interface DocumentoRequest {
  tipo: string;
  descripcion?: string;
  estado: boolean;
}

export interface DocumentoResponse {
  id: number;
  tipo: string;
  descripcion?: string;
  estado: boolean;
  creado: string;
  actualizado: string;
}
