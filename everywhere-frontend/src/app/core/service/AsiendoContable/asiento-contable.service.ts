import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

import {
  AsientoContableRequest,
  AsientoContableResponse
} from '../../../shared/models/AsientoContable/asientoContable.model';

@Injectable({
  providedIn: 'root'
})
export class AsientoContableService {

  private apiUrl = `${environment.baseURL}/asientos-contables`;

  constructor(private http: HttpClient) {
  }

  getAllAsientosContables(): Observable<AsientoContableResponse[]> {
    return this.http.get<AsientoContableResponse[]>(this.apiUrl);
  }

  getByIdAsientoContable(id: number): Observable<AsientoContableResponse> {
    return this.http.get<AsientoContableResponse>(`${this.apiUrl}/${id}`);
  }

  createAsientoContable(
    request: AsientoContableRequest
  ): Observable<AsientoContableResponse> {
    return this.http.post<AsientoContableResponse>(
      this.apiUrl,
      request
    );
  }

  anularAsientoContable(id: number): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/${id}/anular`,
      {}
    );
  }

  findByOrigenAsientoContable(
    origen: string,
    origenId: number
  ): Observable<AsientoContableResponse[]> {

    const params = new HttpParams()
      .set('origen', origen)
      .set('origenId', origenId);

    return this.http.get<AsientoContableResponse[]>(
      `${this.apiUrl}/origen`,
      { params }
    );
  }

}