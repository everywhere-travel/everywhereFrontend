import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UpdateUserNameRequest, UserProfileResponse } from '../../../shared/models/user/user-profile.model';

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
}
