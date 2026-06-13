import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UpdateUserNameRequest, UserProfileResponse } from '../../../shared/models/user/user-profile.model';
import { UsuarioRequest, UsuarioResponse } from '../../../shared/models/Usuario/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.baseURL}/users`;

  getCurrentProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.baseUrl}/me`);
  }

  updateCurrentName(request: UpdateUserNameRequest): Observable<UserProfileResponse> {
    return this.http.patch<UserProfileResponse>(`${this.baseUrl}/me`, request);
  }

  getAllUsers(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(this.baseUrl);
  }

  createUser(request: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(this.baseUrl, request);
  }

  updateUser(id: number, request: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http.put<UsuarioResponse>(`${this.baseUrl}/${id}`, request);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
