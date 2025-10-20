import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Interfaz que representa la información de cada módulo del dashboard
 */
export interface ModuleCardData {
  title: string;
  description: string;
  route: string;
  icon: string; // Nombre de la clase de icono o SVG
  status?: {
    text: string;
    type: 'active' | 'warning' | 'neutral' | 'success';
  };
  action?: {
    text: string;
    icon?: string; // Icono para la acción (opcional)
  };
  featured?: boolean; // Para marcar módulos destacados
  iconType: 'cotizaciones' | 'clientes' | 'liquidaciones' | 'productos' | 'reportes' | 'estadisticas' | 'counters' | 'sucursales' | 'documentos';
  moduleKey?: string; // Clave para permisos del backend
}

@Component({
  selector: 'app-module-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './module-card.component.html',
  styleUrls: ['./module-card.component.css']
})
export class ModuleCardComponent {

  /** Datos del módulo que se renderizará */
  @Input() data!: ModuleCardData;

  /** Permisos que el usuario tiene sobre este módulo (READ, CREATE, UPDATE, DELETE) */
  @Input() permissions?: Array<'READ' | 'CREATE' | 'UPDATE' | 'DELETE'>;

  /**
   * Determina si se puede ejecutar una acción específica según los permisos del usuario
   * @param action Acción a verificar (READ | CREATE | UPDATE | DELETE)
   * @returns boolean
   */
  can(action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE'): boolean {
    if (!this.permissions) return false;
    return this.permissions.includes(action);
  }

  /** Clase CSS para el estado del módulo (activo, warning, neutral, success) */
  getStatusClass(): string {
    if (!this.data.status) return '';
    return `module-status ${this.data.status.type}`;
  }

  /** Clase CSS para el icono del módulo según el tipo */
  getIconClass(): string {
    return `module-icon ${this.data.iconType}`;
  }
}
