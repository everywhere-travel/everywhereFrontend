import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RoleResponse, RoleRequest } from '../../../shared/models/role.model';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.baseURL}/roles`;

  getAll(): Observable<RoleResponse[]> {
    return this.http.get<RoleResponse[]>(this.baseUrl);
  }

  getById(id: number): Observable<RoleResponse> {
    return this.http.get<RoleResponse>(`${this.baseUrl}/${id}`);
  }

  create(request: RoleRequest): Observable<RoleResponse> {
    return this.http.post<RoleResponse>(this.baseUrl, request);
  }

  update(id: number, request: RoleRequest): Observable<RoleResponse> {
    return this.http.put<RoleResponse>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  addPermission(roleId: number, permissionId: number): Observable<RoleResponse> {
    return this.http.post<RoleResponse>(`${this.baseUrl}/${roleId}/permissions`, { permissionId });
  }

  removePermission(roleId: number, permissionId: number): Observable<RoleResponse> {
    return this.http.delete<RoleResponse>(`${this.baseUrl}/${roleId}/permissions/${permissionId}`);
  }
}
