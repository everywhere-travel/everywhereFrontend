import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/service/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[9999] space-y-3 max-w-md pointer-events-none">
      <div *ngIf="toastService.toastSignal() as toast"
           class="pointer-events-auto px-8 py-6 rounded-xl shadow-2xl flex items-start gap-4 animate-fade-in border-l-4"
           [ngClass]="{
             'bg-red-600 text-white border-red-300': toast.type === 'error',
             'bg-green-500 text-white border-green-300': toast.type === 'success',
             'bg-yellow-500 text-white border-yellow-300': toast.type === 'warning',
             'bg-blue-500 text-white border-blue-300': toast.type === 'info'
           }">
        
        <i class="fas flex-shrink-0 mt-1 text-3xl"
           [ngClass]="{
             'fa-exclamation-triangle': toast.type === 'error' || toast.type === 'warning',
             'fa-check-circle': toast.type === 'success',
             'fa-info-circle': toast.type === 'info'
           }"></i>
           
        <div class="flex-1">
          <p class="font-semibold text-lg">{{ toast.title }}</p>
          <p class="text-sm mt-2 break-words whitespace-pre-wrap">{{ toast.message }}</p>
        </div>
        
        <button (click)="toastService.clear()" class="hover:opacity-75 flex-shrink-0 transition-opacity">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);
}
