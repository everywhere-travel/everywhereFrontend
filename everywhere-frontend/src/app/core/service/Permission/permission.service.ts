import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PermissionResponse, PermissionRequest } from '../../../shared/models/role.model';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.baseURL}/permissions`;

  getAll(): Observable<PermissionResponse[]> {
    return this.http.get<PermissionResponse[]>(this.baseUrl);
  }

  getById(id: number): Observable<PermissionResponse> {
    return this.http.get<PermissionResponse>(`${this.baseUrl}/${id}`);
  }

  create(request: PermissionRequest): Observable<PermissionResponse> {
    return this.http.post<PermissionResponse>(this.baseUrl, request);
  }

  update(id: number, request: PermissionRequest): Observable<PermissionResponse> {
    return this.http.put<PermissionResponse>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
