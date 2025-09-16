import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ErrorModalData {
  title: string;
  message: string;
  icon?: string;
  type?: 'error' | 'warning' | 'info' | 'success';
  buttonText?: string;
}

// Formato estándar que debería devolver el backend
export interface BackendErrorResponse {
  error: {
    code: string;
    message: string;
    details?: string;
    type?: 'CONSTRAINT_VIOLATION' | 'NOT_FOUND' | 'FORBIDDEN' | 'VALIDATION_ERROR' | 'SERVER_ERROR';
    relatedEntities?: string[]; // Para casos como "usado en cotizaciones, liquidaciones"
  };
  timestamp: string;
  path: string;
}

@Component({
  selector: 'app-error-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="show" class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
         (click)="onBackdropClick($event)">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100"
           (click)="$event.stopPropagation()">
        <div class="p-8 text-center">
          <!-- Icono dinámico -->
          <div class="mb-6">
            <i [class]="getIconClass()" class="text-5xl"></i>
          </div>
          
          <!-- Título -->
          <h3 class="text-xl font-bold text-gray-900 mb-4">
            {{ data?.title || 'Error' }}
          </h3>
          
          <!-- Mensaje -->
          <p class="text-gray-600 mb-8 leading-relaxed" [innerHTML]="data?.message || 'Ha ocurrido un error inesperado'">
          </p>
          
          <!-- Detalles adicionales si existen -->
          <div *ngIf="backendError?.error?.details" class="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p class="text-sm text-gray-700">
              <strong>Detalles técnicos:</strong><br>
              {{ backendError?.error?.details }}
            </p>
          </div>
          
          <!-- Entidades relacionadas -->
          <div *ngIf="backendError?.error?.relatedEntities?.length" class="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <p class="text-sm text-blue-800">
              <strong>Relacionado con:</strong>
              <span class="block mt-1">{{ backendError?.error?.relatedEntities?.join(', ') }}</span>
            </p>
          </div>
          
          <!-- Botón de cerrar -->
          <button type="button" (click)="onClose()"
            [class]="getButtonClass()"
            class="w-full px-6 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg">
            <i class="fas fa-check mr-2"></i>{{ data?.buttonText || 'Entendido' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ErrorModalComponent {
  @Input() show: boolean = false;
  @Input() data: ErrorModalData | null = null;
  @Input() backendError: BackendErrorResponse | null = null;
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  getIconClass(): string {
    if (this.data?.icon) {
      return this.data.icon;
    }

    // Iconos por tipo de error del backend
    if (this.backendError?.error?.type) {
      switch (this.backendError.error.type) {
        case 'CONSTRAINT_VIOLATION':
          return 'fas fa-link text-yellow-500';
        case 'NOT_FOUND':
          return 'fas fa-search text-blue-500';
        case 'FORBIDDEN':
          return 'fas fa-lock text-red-500';
        case 'VALIDATION_ERROR':
          return 'fas fa-exclamation-triangle text-orange-500';
        default:
          return 'fas fa-times-circle text-red-500';
      }
    }

    // Iconos por tipo general
    switch (this.data?.type) {
      case 'warning':
        return 'fas fa-exclamation-triangle text-yellow-500';
      case 'info':
        return 'fas fa-info-circle text-blue-500';
      case 'success':
        return 'fas fa-check-circle text-green-500';
      default:
        return 'fas fa-times-circle text-red-500';
    }
  }

  getButtonClass(): string {
    switch (this.data?.type) {
      case 'warning':
        return 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white hover:from-yellow-700 hover:to-yellow-800';
      case 'info':
        return 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800';
      case 'success':
        return 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800';
      default:
        return 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800';
    }
  }
}