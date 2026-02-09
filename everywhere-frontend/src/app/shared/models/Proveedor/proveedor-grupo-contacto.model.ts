export interface ProveedorGrupoContactoRequest {
    nombre: string;
    descripcion?: string;
}

export interface ProveedorGrupoContactoResponse {
    id: number;
    nombre: string;
    descripcion?: string;
    creado: string;
    actualizado: string;
}
