import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConfirmationConfig {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info' | 'success';
    icon?: string;
}

@Component({
    selector: 'app-confirmation-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './confirmation-modal.component.html',
    styleUrls: ['./confirmation-modal.component.css']
})
export class ConfirmationModalComponent {
    @Input() show: boolean = false;
    @Input() config: ConfirmationConfig = {
        title: '¿Estás seguro?',
        message: '¿Deseas continuar con esta acción?',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        type: 'warning'
    };

    @Output() confirmed = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    onConfirm(): void {
        this.confirmed.emit();
        this.show = false;
    }

    onCancel(): void {
        this.cancelled.emit();
        this.show = false;
    }

    onBackdropClick(event: Event): void {
        if (event.target === event.currentTarget) {
            this.onCancel();
        }
    }

    getIconClass(): string {
        if (this.config.icon) {
            return this.config.icon;
        }

        switch (this.config.type) {
            case 'danger':
            case 'warning':
                return 'fas fa-exclamation-triangle text-yellow-500';
            case 'info':
                return 'fas fa-info-circle text-blue-500';
            case 'success':
                return 'fas fa-check-circle text-green-500';
            default:
                return 'fas fa-question-circle text-gray-500';
        }
    }

    getConfirmButtonClass(): string {
        switch (this.config.type) {
            case 'danger':
                return 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800';
            case 'warning':
                return 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white hover:from-yellow-700 hover:to-yellow-800';
            case 'info':
                return 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800';
            case 'success':
                return 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800';
            default:
                return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800';
        }
    }
}
