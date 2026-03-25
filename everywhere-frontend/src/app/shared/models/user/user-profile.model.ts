export interface UserProfileResponse {
  id: number;
  name: string;
  email: string;
  role: string | null;
  sucursal: {
    id: number;
    descripcion: string;
    direccion: string;
    telefono: string;
    email: string;
    estado: boolean;
    fechaCreacion: string;
    fechaActualizacion: string;
  } | null;
}

export interface UpdateUserNameRequest {
  name: string;
}
