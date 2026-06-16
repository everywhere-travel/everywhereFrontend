import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../service/storage.service';
import { AuthServiceService } from '../service/auth/auth.service';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastService } from '../service/toast.service';
import { ErrorHandlerService } from '../service/error-handler.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);
  const authService = inject(AuthServiceService);
  const router = inject(Router);
  const toastService = inject(ToastService);
  const errorHandler = inject(ErrorHandlerService);
  const authData = storageService.getAuthData();

  let authReq = req;
  if (authData && authData.token) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${authData.token}`)
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      } else if (error.status === 403) {
        console.warn('Acceso denegado a este recurso (403).');
        toastService.showError(errorHandler.getErrorMessage(error), 'Acceso Denegado');
        (error as any).isHandledGlobally = true; // Flag for local components to ignore
      }
      return throwError(() => error);
    })
  );
};
