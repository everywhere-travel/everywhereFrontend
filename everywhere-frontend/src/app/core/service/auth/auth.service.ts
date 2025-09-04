import { inject, Injectable, Injector } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { StorageService } from '../../services/storage.service';
import { AuthRequest } from '../../../models/auth/auth-request-model';
import { Observable, tap } from 'rxjs';
import { AuthResponse } from '../../../models/auth/auth-response-model';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {
  private baseURL = `${environment.baseURL}/auth`;
  private http = inject(HttpClient);
  private storageService = inject(StorageService);

  private injector = inject(Injector);


  login(autRequest: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseURL}/login`, autRequest).pipe(
      tap(response => {
        this.storageService.setAuthData(response);
      })
    );
  }

  logout() {
    this.storageService.clearAuthData();
  }

  isAuthenticated(): boolean {
    return this.storageService.getAuthData() !== null;
  }

  getUser(): AuthResponse | null {
    const authData = this.storageService.getAuthData();
    return authData ? authData : null;
  }

  getRole(): String | null {
    const authData = this.storageService.getAuthData();
    return authData ? authData.role : null;
  }

  getCurrentUserId(): number | null {
    const user = this.getUser();
    return user ? user.id : null;
  }

}
