import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProveedorColaboradorRequest, ProveedorColaboradorResponse } from '../../../shared/models/Proveedor/proveedor-colaborador.model';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ProveedorColaboradorService {
    private apiUrl = `${environment.baseURL}/proveedor-colaborador`;

    constructor(private http: HttpClient) { }

    findAll(): Observable<ProveedorColaboradorResponse[]> {
        return this.http.get<ProveedorColaboradorResponse[]>(this.apiUrl);
    }

    getById(id: number): Observable<ProveedorColaboradorResponse> {
        return this.http.get<ProveedorColaboradorResponse>(`${this.apiUrl}/${id}`);
    }

    getByProveedorId(proveedorId: number): Observable<ProveedorColaboradorResponse[]> {
        return this.http.get<ProveedorColaboradorResponse[]>(`${this.apiUrl}/proveedor/${proveedorId}`);
    }

    create(request: ProveedorColaboradorRequest): Observable<ProveedorColaboradorResponse> {
        return this.http.post<ProveedorColaboradorResponse>(this.apiUrl, request);
    }

    update(id: number, request: ProveedorColaboradorRequest): Observable<ProveedorColaboradorResponse> {
        return this.http.patch<ProveedorColaboradorResponse>(`${this.apiUrl}/${id}`, request);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
