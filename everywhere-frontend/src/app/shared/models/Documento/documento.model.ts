export interface DocumentoRequest {
  tipo: string;
  descripcion: string;
}

export interface DocumentoResponse {
  id: number;
  tipo: string;
  descripcion: string;
  creado: Date;
  actualizado: Date;
}
