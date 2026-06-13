import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { StorageService } from '../storage.service';
import { AuthRequest } from '../../../shared/models/auth/auth-request-model';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { AuthResponse } from '../../../shared/models/auth/auth-response-model';
import { hasPermission } from '../../../shared/models/role.model';

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
        this.currentUserSubject.next(response);
      })
    );
  }

  logout(): void {
    this.storageService.clearAuthData();
    this.currentUserSubject.next(null);
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

  updateCurrentUserName(name: string): void {
    const current = this.currentUserSubject.value;
    if (!current) {
      return;
    }
    const updated = { ...current, name };
    this.storageService.setAuthData(updated);
    this.currentUserSubject.next(updated);
  }

  /**
   * Verifica si el usuario tiene permiso para un módulo+acción.
   * Usa el nuevo formato plano: "MODULO:ACCION"
   */
  hasPermission(module: string, action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE'): boolean {
    const permissions = this.currentUserSubject.value?.permissions ?? [];
    return hasPermission(permissions, module, action);
  }

  /**
   * Obtiene todos los permisos del usuario actual
   */
  getPermissions(): string[] {
    return this.currentUserSubject.value?.permissions ?? [];
  }
}
