export interface ProveedorColaboradorRequest {
    cargo?: string;
    nombre: string;
    email?: string;
    telefono?: string;
    codigoPais?: string;
    detalle?: string;
    proveedorId?: number;
}

export interface ProveedorColaboradorResponse {
    id: number;
    cargo?: string;
    nombre: string;
    email?: string;
    telefono?: string;
    codigoPais?: string;
    detalle?: string;
    creado: string;
    actualizado: string;
    proveedorId?: number;
    proveedorNombre?: string;
}
