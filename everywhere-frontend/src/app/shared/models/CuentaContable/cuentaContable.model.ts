export interface CuentaContableRequest {
    codigo?: string;
    nombre?: string;
    tipo?: string;
    activo?: boolean;
}
export interface CuentaContableResponse {
    id?: number;

    codigo?: string;
    nombre?: string;
    tipo?: string;
    activo?: boolean;

    creado?: string;
    actualizado?: string;
}