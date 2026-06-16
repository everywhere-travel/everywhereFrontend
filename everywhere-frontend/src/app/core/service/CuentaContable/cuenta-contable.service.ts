import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

import {
  CuentaContableRequest,
  CuentaContableResponse
} from '../../../shared/models/CuentaContable/cuentaContable.model';

@Injectable({
  providedIn: 'root'
})
export class CuentaContableService {

  private apiUrl = `${environment.baseURL}/cuentas-contables`;

  constructor(private http: HttpClient) {
  }

  getAllCuentasContables(): Observable<CuentaContableResponse[]> {
    return this.http.get<CuentaContableResponse[]>(this.apiUrl);
  }

  getByIdCuentaContable(id: number): Observable<CuentaContableResponse> {
    return this.http.get<CuentaContableResponse>(`${this.apiUrl}/${id}`);
  }

  createCuentaContable(
    request: CuentaContableRequest
  ): Observable<CuentaContableResponse> {
    return this.http.post<CuentaContableResponse>(
      this.apiUrl,
      request
    );
  }

  updateCuentaContable(
    id: number,
    request: CuentaContableRequest
  ): Observable<CuentaContableResponse> {
    return this.http.put<CuentaContableResponse>(
      `${this.apiUrl}/${id}`,
      request
    );
  }

  deleteByIdCuentaContable(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}