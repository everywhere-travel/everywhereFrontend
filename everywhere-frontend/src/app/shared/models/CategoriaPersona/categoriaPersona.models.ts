export interface CategoriaPersonaRequest {
    nombre?: string;
    descripcion?: string;
}

export interface CategoriaPersonaResponse {
    id?: number;
    nombre?: string;
    descripcion?: string;
    creado: string;
    actualizado: string;
}
