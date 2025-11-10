import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export interface ErrorResponse {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  /**
   * Extrae el mensaje de error del response del backend
   * Soporta múltiples formatos de error
   */
  getErrorMessage(error: any): string {
    // Si es HttpErrorResponse
    if (error instanceof HttpErrorResponse) {
      // Formato 1: error.error.detail (Problema RFC 7807)
      if (error.error?.detail) {
        return error.error.detail;
      }

      // Formato 2: error.error.message
      if (error.error?.message) {
        return error.error.message;
      }

      // Formato 3: error.error.error
      if (error.error?.error) {
        return error.error.error;
      }

      // Formato 4: error.message
      if (error.message) {
        return error.message;
      }

      // Formato 5: error.error es string
      if (typeof error.error === 'string') {
        return error.error;
      }

      // Status y título por defecto
      return `Error ${error.status}: ${error.statusText || 'Error en la solicitud'}`;
    }

    // Si es un objeto genérico
    if (error?.detail) return error.detail;
    if (error?.message) return error.message;
    if (error?.error) return error.error;

    // Fallback genérico
    return 'Error desconocido. Por favor intente nuevamente.';
  }

  /**
   * Retorna el status HTTP del error
   */
  getStatusCode(error: any): number {
    if (error instanceof HttpErrorResponse) {
      return error.status;
    }
    return error?.status || 500;
  }

  /**
   * Verifica si es un error de conflicto (409)
   */
  isConflict(error: any): boolean {
    return this.getStatusCode(error) === 409;
  }

  /**
   * Verifica si es un error de no encontrado (404)
   */
  isNotFound(error: any): boolean {
    return this.getStatusCode(error) === 404;
  }

  /**
   * Verifica si es un error de validación (400)
   */
  isBadRequest(error: any): boolean {
    return this.getStatusCode(error) === 400;
  }

  /**
   * Verifica si es un error de autorización (401)
   */
  isUnauthorized(error: any): boolean {
    return this.getStatusCode(error) === 401;
  }

  /**
   * Verifica si es un error de prohibido (403)
   */
  isForbidden(error: any): boolean {
    return this.getStatusCode(error) === 403;
  }
}
