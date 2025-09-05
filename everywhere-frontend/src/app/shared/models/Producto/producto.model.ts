export interface ProductoRequest {
  descripcion: string;
  tipo: string;
}

export interface ProductoResponse {
  id: number;
  codigo: string;
  descripcion: string;
  tipo: string;
  creado: string;
  actualizado: string;
}
