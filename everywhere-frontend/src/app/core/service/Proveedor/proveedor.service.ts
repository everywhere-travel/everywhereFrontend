import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProveedorRequest, ProveedorResponse } from '../../../shared/models/Proveedor/proveedor.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  private apiUrl = `${environment.baseURL}/proveedores`;

  constructor(private http: HttpClient) {
  }

  findAllProveedor(): Observable<ProveedorResponse[]> {
    return this.http.get<ProveedorResponse[]>(this.apiUrl);
  }

  getByIdProveedor(id: number): Observable<ProveedorResponse> {
    return this.http.get<ProveedorResponse>(`${this.apiUrl}/${id}`);
  }

  createProveedor(proveedorRequest: ProveedorRequest): Observable<ProveedorResponse> {
    return this.http.post<ProveedorResponse>(this.apiUrl, proveedorRequest);
  }

  updateProveedor(id: number, proveedorRequest: ProveedorRequest): Observable<ProveedorResponse> {
    return this.http.put<ProveedorResponse>(`${this.apiUrl}/${id}`, proveedorRequest);
  }

  deleteByIdProveedor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
