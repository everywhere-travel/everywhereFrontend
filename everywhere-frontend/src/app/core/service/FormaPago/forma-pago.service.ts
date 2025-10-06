import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FormaPagoResponse, FormaPagoRequest} from '../../../shared/models/FormaPago/formaPago.model';

@Injectable({
  providedIn: 'root'
})
export class FormaPagoService {
  private apiUrl = `${environment.baseURL}/formas-pago`;

  constructor(private http: HttpClient) {
  }

  getAllFormasPago(): Observable<FormaPagoResponse[]> {
    return this.http.get<FormaPagoResponse[]>(this.apiUrl);
  }

  getByIdFormaPago(id: number): Observable<FormaPagoResponse> {
    return this.http.get<FormaPagoResponse>(`${this.apiUrl}/${id}`);
  }

  getByCodigoFormaPago(codigo: number): Observable<FormaPagoResponse> {
    return this.http.get<FormaPagoResponse>(`${this.apiUrl}/codigo/${codigo}`);
  }

  getByDescripcionFormaPago(descripcion: string): Observable<FormaPagoResponse[]> {
    const params = new HttpParams().set('descripcion', descripcion);
    return this.http.get<FormaPagoResponse[]>(`${this.apiUrl}/descripcion`, {params});
  }

  saveFormaPago(formaPago: FormaPagoRequest): Observable<FormaPagoResponse> {
    return this.http.post<FormaPagoResponse>(this.apiUrl, formaPago);
  }

  updateByIdFormaPago(id: number, formaPago: FormaPagoRequest): Observable<FormaPagoResponse> {
    return this.http.put<FormaPagoResponse>(`${this.apiUrl}/${id}`, formaPago);
  }

  deleteByIdFormaPago(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}
