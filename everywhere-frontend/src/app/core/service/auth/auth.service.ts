import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { StorageService } from '../storage.service';
import { AuthRequest } from '../../../shared/models/auth/auth-request-model';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { AuthResponse } from '../../../shared/models/auth/auth-response-model';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {
  private baseURL = `${environment.baseURL}/auth`;
  private http = inject(HttpClient);
  private storageService = inject(StorageService);

  // Observable central para usuario actual
  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(this.storageService.getAuthData());
  currentUser$ = this.currentUserSubject.asObservable();

  login(authRequest: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseURL}/login`, authRequest).pipe(
      tap(response => {
        this.storageService.setAuthData(response);
        this.currentUserSubject.next(response); // Actualizamos el observable
      })
    );
  }

  logout(): void {
    this.storageService.clearAuthData();
    this.currentUserSubject.next(null); // Emitimos null al hacer logout
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  getUser(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  getRole(): string | null {
    return this.currentUserSubject.value?.role || null;
  }

  getCurrentUserId(): number | null {
    return this.currentUserSubject.value?.id || null;
  }

  hasPermission(moduleKey: string, action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE'): boolean {
    return this.currentUserSubject.value?.permissions?.[moduleKey]?.includes(action) || false;
  }
}
