import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface ModuleCardData {
  title: string;
  description: string;
  route: string;
  icon: string; // SVG string o nombre del icono
  status?: {
    text: string;
    type: 'active' | 'warning' | 'neutral' | 'success';
  };
  action?: {
    text: string;
    icon?: string; // SVG string para el icono de acción
  };
  featured?: boolean;
  iconType: 'cotizaciones' | 'clientes' | 'liquidaciones' | 'productos' | 'reportes' | 'estadisticas' | 'counters' | 'sucursales';
}

@Component({
  selector: 'app-module-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './module-card.component.html',
  styleUrls: ['./module-card.component.css']
})
export class ModuleCardComponent {
  @Input() data!: ModuleCardData;

  getStatusClass(): string {
    if (!this.data.status) return '';
    return `module-status ${this.data.status.type}`;
  }

  getIconClass(): string {
    return `module-icon ${this.data.iconType}`;
  }
}
