import { RoleResponse } from '../role.model';
import { SucursalResponse } from '../Sucursal/sucursal.model';

export interface UsuarioResponse {
  id: number;
  nombre: string;
  email: string;
  role: RoleResponse;
  sucursal: SucursalResponse | null;
  creado?: string;
  actualizado?: string;
}

export interface UsuarioRequest {
  nombre: string;
  email: string;
  password?: string;
  roleId: number;
  sucursalId?: number;
}
