import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  title: string;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toastSignal = signal<ToastData | null>(null);
  private timeoutId: any;

  show(title: string, message: string, type: ToastType = 'info', duration: number = 5000) {
    this.toastSignal.set({ title, message, type });
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    
    if (duration > 0) {
      this.timeoutId = setTimeout(() => {
        this.clear();
      }, duration);
    }
  }

  showSuccess(message: string, title: string = 'Éxito') {
    this.show(title, message, 'success');
  }

  showError(message: string, title: string = 'Error') {
    this.show(title, message, 'error', 7000); // 7 seconds for errors
  }

  showWarning(message: string, title: string = 'Advertencia') {
    this.show(title, message, 'warning');
  }

  showInfo(message: string, title: string = 'Información') {
    this.show(title, message, 'info');
  }

  clear() {
    this.toastSignal.set(null);
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}
