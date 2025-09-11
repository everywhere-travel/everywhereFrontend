import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorModalData, BackendErrorResponse } from '../components/error-modal/error-modal.component';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor() { }

  /**
   * Convierte un HttpErrorResponse en datos para el modal de error
   */
  handleHttpError(error: HttpErrorResponse, context?: string): { modalData: ErrorModalData, backendError?: BackendErrorResponse } {
    let modalData: ErrorModalData;
    let backendError: BackendErrorResponse | undefined;

    // Intentar parsear la respuesta del backend si existe
    if (error.error && typeof error.error === 'object') {
      backendError = error.error as BackendErrorResponse;
    }

    switch (error.status) {
      case 400:
        modalData = this.handleBadRequest(error, backendError, context);
        break;
      case 403:
        modalData = this.handleForbidden(error, backendError, context);
        break;
      case 404:
        modalData = this.handleNotFound(error, backendError, context);
        break;
      case 409:
        modalData = this.handleConflict(error, backendError, context);
        break;
      case 500:
        modalData = this.handleServerError(error, backendError, context);
        break;
      default:
        modalData = this.handleGenericError(error, backendError, context);
    }

    return { modalData, backendError };
  }

  private handleBadRequest(error: HttpErrorResponse, backendError?: BackendErrorResponse, context?: string): ErrorModalData {
    if (backendError?.error?.type === 'VALIDATION_ERROR') {
      return {
        title: 'Datos inválidos',
        message: backendError.error.message || 'Los datos enviados no son válidos. Por favor, revise la información.',
        type: 'warning',
        buttonText: 'Revisar'
      };
    }

    return {
      title: 'Solicitud inválida',
      message: backendError?.error?.message || 'La solicitud no pudo ser procesada. Verifique los datos e inténtelo nuevamente.',
      type: 'warning'
    };
  }

  private handleForbidden(error: HttpErrorResponse, backendError?: BackendErrorResponse, context?: string): ErrorModalData {
    return {
      title: 'Sin permisos',
      message: backendError?.error?.message || `No tiene los permisos necesarios para realizar esta operación${context ? ` en ${context}` : ''}.`,
      type: 'error'
    };
  }

  private handleNotFound(error: HttpErrorResponse, backendError?: BackendErrorResponse, context?: string): ErrorModalData {
    return {
      title: 'No encontrado',
      message: backendError?.error?.message || `El recurso solicitado${context ? ` (${context})` : ''} no existe o ya fue eliminado.`,
      type: 'info'
    };
  }

  private handleConflict(error: HttpErrorResponse, backendError?: BackendErrorResponse, context?: string): ErrorModalData {
    if (backendError?.error?.type === 'CONSTRAINT_VIOLATION') {
      const relatedText = backendError.error.relatedEntities?.length 
        ? ` Esta información está siendo utilizada en: <strong>${backendError.error.relatedEntities.join(', ')}</strong>.`
        : '';

      return {
        title: 'No se puede eliminar',
        message: `${backendError.error.message || 'Este elemento está siendo utilizado por otros registros.'} ${relatedText} Para eliminarlo, primero debe removerlo de todas las referencias existentes.`,
        type: 'warning',
        buttonText: 'Entendido'
      };
    }

    return {
      title: 'Conflicto de datos',
      message: backendError?.error?.message || 'La operación no se puede completar debido a un conflicto con los datos existentes.',
      type: 'warning'
    };
  }

  private handleServerError(error: HttpErrorResponse, backendError?: BackendErrorResponse, context?: string): ErrorModalData {
    // Casos especiales para error 500
    if (backendError?.error?.type === 'CONSTRAINT_VIOLATION') {
      return this.handleConflict(error, backendError, context);
    }

    return {
      title: 'Error del servidor',
      message: backendError?.error?.message || 'Ocurrió un error interno del servidor. Por favor, inténtelo nuevamente más tarde.',
      type: 'error'
    };
  }

  private handleGenericError(error: HttpErrorResponse, backendError?: BackendErrorResponse, context?: string): ErrorModalData {
    return {
      title: 'Error inesperado',
      message: backendError?.error?.message || `Ocurrió un error inesperado${context ? ` al ${context}` : ''}. Por favor, inténtelo nuevamente.`,
      type: 'error'
    };
  }

  /**
   * Crear datos de modal de error personalizado
   */
  createCustomError(title: string, message: string, type: 'error' | 'warning' | 'info' | 'success' = 'error', buttonText?: string): ErrorModalData {
    return {
      title,
      message,
      type,
      buttonText
    };
  }
}