export interface DetalleAsientoContableRequest {
    cuentaId?: number;
    debe?: number;
    haber?: number;
}
export interface DetalleAsientoContableResponse {
    id?: number;

    cuentaId?: number;
    cuentaCodigo?: string;
    cuentaNombre?: string;

    debe?: number;
    haber?: number;

    creado?: string;
    actualizado?: string;
}