import { inject, Injectable, Injector } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { StorageService } from '../storage.service';
import { AuthRequest } from '../../../models/auth/auth-request-model';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuthResponse } from '../../../models/auth/auth-response-model';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {
  private baseURL = `${environment.baseURL}/auth`;
  private http = inject(HttpClient);
  private storageService = inject(StorageService);

  private injector = inject(Injector);

  
  login(autRequest : AuthRequest) : Observable<AuthResponse>{
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });

      console.log('Intentando login con URL:', `${this.baseURL}/login`);
      console.log('Datos de solicitud:', autRequest);

      return this.http.post<AuthResponse>(`${this.baseURL}/login`, autRequest, { headers }).pipe(
        tap(response => {
          console.log('Login exitoso:', response);
          this.storageService.setAuthData(response);
        }),
        catchError(error => {
          console.error('Error detallado en login:', error);
          console.error('URL intentada:', `${this.baseURL}/login`);
          console.error('Status:', error.status);
          console.error('Error message:', error.message);
          
          if (error.status === 0) {
            console.error('Error de conexión - verificar si el backend está corriendo en:', environment.baseURL);
          }
          
          return throwError(() => error);
        })
      );
  }

  logout()
  {
    this.storageService.clearAuthData();
  }

  isAuthenticated(): boolean {
    return this.storageService.getAuthData() !== null;
  }

  getUser():AuthResponse | null {
    const authData= this.storageService.getAuthData();
    return authData ? authData : null;
  }

  getRole():String | null {
    const authData = this.storageService.getAuthData();
    return authData ? authData.role : null;
  }

  getCurrentUserId(): number | null {
    const user = this.getUser(); 
    return user ? user.id : null;
  }

}
