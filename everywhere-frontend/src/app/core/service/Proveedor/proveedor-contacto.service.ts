import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProveedorContactoRequest, ProveedorContactoResponse } from '../../../shared/models/Proveedor/proveedor-contacto.model';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ProveedorContactoService {
    private apiUrl = `${environment.baseURL}/proveedor-contacto`;

    constructor(private http: HttpClient) { }

    findAll(): Observable<ProveedorContactoResponse[]> {
        return this.http.get<ProveedorContactoResponse[]>(this.apiUrl);
    }

    getById(id: number): Observable<ProveedorContactoResponse> {
        return this.http.get<ProveedorContactoResponse>(`${this.apiUrl}/${id}`);
    }

    getByProveedorId(proveedorId: number): Observable<ProveedorContactoResponse[]> {
        return this.http.get<ProveedorContactoResponse[]>(`${this.apiUrl}/proveedor/${proveedorId}`);
    }

    getByGrupoContactoId(grupoId: number): Observable<ProveedorContactoResponse[]> {
        return this.http.get<ProveedorContactoResponse[]>(`${this.apiUrl}/grupo/${grupoId}`);
    }

    create(request: ProveedorContactoRequest): Observable<ProveedorContactoResponse> {
        return this.http.post<ProveedorContactoResponse>(this.apiUrl, request);
    }

    update(id: number, request: ProveedorContactoRequest): Observable<ProveedorContactoResponse> {
        return this.http.patch<ProveedorContactoResponse>(`${this.apiUrl}/${id}`, request);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
