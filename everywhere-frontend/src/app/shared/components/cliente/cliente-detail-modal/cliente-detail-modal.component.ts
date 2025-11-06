import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PersonaTabla {
  id: number;
  tipo: 'natural' | 'juridica';
  nombre: string;
  nombres?: string;
  apellidosPaterno?: string;
  apellidosMaterno?: string;
  razonSocial?: string;
  documento: string;
  ruc?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}

@Component({
  selector: 'app-cliente-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cliente-detail-modal.component.html',
  styleUrls: ['./cliente-detail-modal.component.css']
})
export class ClienteDetailModalComponent {

  @Input() cliente: PersonaTabla | null = null;
  @Input() visible: boolean = false;

  @Output() cerrar = new EventEmitter<void>();
  @Output() editarCompleto = new EventEmitter<PersonaTabla>();

  onCerrar(): void {
    this.cerrar.emit();
  }

  onEditarCompleto(): void {
    if (this.cliente) {
      this.editarCompleto.emit(this.cliente);
    }
  }

  onBackdropClick(): void {
    this.onCerrar();
  }

  onModalClick(event: Event): void {
    event.stopPropagation();
  }

  getClientInitials(): string {
    if (!this.cliente) return '';

    if (this.cliente.tipo === 'natural') {
      const nombres = this.cliente.nombres || '';
      const paterno = this.cliente.apellidosPaterno || '';
      const materno = this.cliente.apellidosMaterno || '';
      return (nombres.charAt(0) + paterno.charAt(0) + materno.charAt(0)).toUpperCase();
    }

    const razon = this.cliente.razonSocial || '';
    return razon.substring(0, 2).toUpperCase();
  }

  getClienteNombre(): string {
    if (!this.cliente) return '';

    if (this.cliente.tipo === 'natural') {
      return `${this.cliente.nombres || ''} ${this.cliente.apellidosPaterno || ''} ${this.cliente.apellidosMaterno || ''}`.trim();
    }

    return this.cliente.razonSocial || '';
  }

  getPersonaTypeLabel(): string {
    if (!this.cliente) return '';
    return this.cliente.tipo === 'natural' ? 'Persona Natural' : 'Persona Jurídica';
  }

  getDocumentType(): string {
    if (!this.cliente) return '';
    return this.cliente.tipo === 'natural' ? 'DNI' : 'RUC';
  }

  getDocumentValue(): string {
    if (!this.cliente) return '';
    return this.cliente.documento || this.cliente.ruc || '';
  }
}
