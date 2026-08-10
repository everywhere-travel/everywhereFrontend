import { FormaPagoResponse } from "../FormaPago/formaPago.model";

export interface PagoPaxRequest {
  monto: number;
  moneda?: string;
  detalle?: string;
  liquidacionId: number;
  formaPagoId: number;
  proveedorId: number;
}

export interface PagoPaxResponse {
  id: number;
  monto: number;
  moneda?: string;
  detalle?: string;
  creado: string;
  actualizado: string;
  formaPago?: FormaPagoResponse;
  proveedor?: any; // or import ProveedorResponse
}
