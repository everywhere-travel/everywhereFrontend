export interface ProveedorContactoRequest {
    descripcion?: string;
    email?: string;
    numero?: string;
    codigoPais?: string;
    proveedorId?: number;
    grupoContactoId?: number;
}

export interface ProveedorContactoResponse {
    id: number;
    descripcion?: string;
    email?: string;
    numero?: string;
    codigoPais?: string;
    creado: string;
    actualizado: string;
    proveedorId?: number;
    proveedorNombre?: string;
    grupoContactoId?: number;
    grupoContactoNombre?: string;
}
