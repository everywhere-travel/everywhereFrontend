import { DetalleAsientoContableRequest, DetalleAsientoContableResponse } from "./detalleAsientoContable.mode";
export interface AsientoContableRequest {
    fecha?: string;
    glosa?: string;
    origen?: string;
    origenId?: number;
    moneda?: string;
    generadoAutomaticamente?: boolean;

    detalles?: DetalleAsientoContableRequest[];
}
export interface AsientoContableResponse {
    id?: number;

    fecha?: string;
    glosa?: string;
    origen?: string;
    origenId?: number;
    moneda?: string;

    totalDebe?: number;
    totalHaber?: number;

    anulado?: boolean;
    generadoAutomaticamente?: boolean;

    creado?: string;
    actualizado?: string;

    detalles?: DetalleAsientoContableResponse[];
}