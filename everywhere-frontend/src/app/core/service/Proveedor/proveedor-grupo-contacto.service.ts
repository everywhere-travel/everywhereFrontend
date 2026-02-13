import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProveedorGrupoContactoRequest, ProveedorGrupoContactoResponse } from '../../../shared/models/Proveedor/proveedor-grupo-contacto.model';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ProveedorGrupoContactoService {
    private apiUrl = `${environment.baseURL}/proveedor-grupo-contacto`;

    constructor(private http: HttpClient) { }

    findAll(): Observable<ProveedorGrupoContactoResponse[]> {
        return this.http.get<ProveedorGrupoContactoResponse[]>(this.apiUrl);
    }

    getById(id: number): Observable<ProveedorGrupoContactoResponse> {
        return this.http.get<ProveedorGrupoContactoResponse>(`${this.apiUrl}/${id}`);
    }

    searchByNombre(nombre: string): Observable<ProveedorGrupoContactoResponse[]> {
        return this.http.get<ProveedorGrupoContactoResponse[]>(`${this.apiUrl}/search?nombre=${nombre}`);
    }

    create(request: ProveedorGrupoContactoRequest): Observable<ProveedorGrupoContactoResponse> {
        return this.http.post<ProveedorGrupoContactoResponse>(this.apiUrl, request);
    }

    update(id: number, request: ProveedorGrupoContactoRequest): Observable<ProveedorGrupoContactoResponse> {
        return this.http.patch<ProveedorGrupoContactoResponse>(`${this.apiUrl}/${id}`, request);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
