export interface SucursalRequest {
  descripcion: string;
  direccion: string;
  telefono: string;
  email: string;
  estado: boolean;
}

export interface SucursalResponse {
  id: number;
  descripcion: string;
  direccion: string;
  telefono: string;
  email: string;
  estado: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}
