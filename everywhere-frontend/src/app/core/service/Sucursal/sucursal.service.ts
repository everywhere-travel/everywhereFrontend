import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SucursalRequest, SucursalResponse} from '../../../shared/models/Sucursal/sucursal.model';

@Injectable({
  providedIn: 'root'
})
export class SucursalService {
  private apiUrl = `${environment.baseURL}/sucursales`;

  constructor(private http: HttpClient) { }

  findAllSucursal(): Observable<SucursalResponse[]> {
    return this.http.get<SucursalResponse[]>(this.apiUrl);
  }

  findByIdSucursal(id: number): Observable<SucursalResponse> {
    return this.http.get<SucursalResponse>(`${this.apiUrl}/${id}`);
  }

  findByEstadoSucursal(estado: boolean): Observable<SucursalResponse[]> {
    return this.http.get<SucursalResponse[]>(`${this.apiUrl}/estado/${estado}`);
  }

  saveSucursal(sucursal: SucursalRequest): Observable<SucursalResponse> {
    return this.http.post<SucursalResponse>(this.apiUrl, sucursal);
  }

  updateSucursal(id: number, sucursal: SucursalRequest): Observable<SucursalResponse> {
    return this.http.patch<SucursalResponse>(`${this.apiUrl}/${id}`, sucursal);
  }

  cambiarEstadoSucursal(id: number, estado: boolean): Observable<SucursalResponse> {
    const params = new HttpParams().set('estado', estado.toString());
    return this.http.patch<SucursalResponse>(`${this.apiUrl}/${id}/estado`, null, { params });
  }

  deleteByIdSucursal(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}
