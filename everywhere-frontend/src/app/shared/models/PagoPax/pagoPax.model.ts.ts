import { LiquidacionResponse } from "../Liquidacion/liquidacion.model";
import { FormaPagoResponse } from "../FormaPago/formaPago.model";

export interface PagoPaxRequest {
  monto: number;
  moneda?: string;
  detalle?: string;
  liquidacionId: number;
  formaPagoId: number;
}

export interface PagoPaxResponse {
  id: number;
  monto: number;
  moneda?: string;
  detalle?: string;
  creado: string;
  actualizado: string;
  liquidacion?: LiquidacionResponse;
  formaPago?: FormaPagoResponse;
}
