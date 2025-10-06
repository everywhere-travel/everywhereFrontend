import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthServiceService } from '../../../core/service/auth/auth.service';

export interface SidebarMenuItem {
  id: string;
  title: string;
  icon: string;
  route?: string;
  badge?: string;
  badgeColor?: string;
  children?: SidebarMenuItem[];
  active?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() isCollapsed = false;
  @Input() menuItems: SidebarMenuItem[] = [];
  @Output() itemClick = new EventEmitter<SidebarMenuItem>();
  @Output() toggleSidebar = new EventEmitter<void>();

  expandedItems: Set<string> = new Set();
  showUserMenu = false;

  constructor(
    private authService: AuthServiceService,
    private router: Router
  ) {}

  onItemClick(item: SidebarMenuItem): void {
    if (item.children && item.children.length > 0) {
      this.toggleExpanded(item.id);
    } else {
      this.itemClick.emit(item);
    }
  }

  toggleExpanded(itemId: string): void {
    if (this.expandedItems.has(itemId)) {
      this.expandedItems.delete(itemId);
    } else {
      this.expandedItems.add(itemId);
    }
  }

  isExpanded(itemId: string): boolean {
    return this.expandedItems.has(itemId);
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  // Métodos para obtener información del usuario
getCurrentUser() {
  const authData = this.authService.getUser();
  return {
    name: authData?.name || 'Usuario',
    role: authData?.role || 'USER', // <-- rol tal como viene del backend
    displayRole: this.getRoleDisplayName(authData?.role || 'USER') // <-- rol legible
  };
}

// Método para mapear los roles a nombres amigables
private getRoleDisplayName(role: string): string {
  const roleMap: { [key: string]: string } = {
    'GERENTE': 'Gerente',
    'VENTAS': 'Ventas',
    'ADMINISTRAR': 'Administrar',
    'ADMIN': 'Administrador',
    'SISTEMAS': 'Sistemas',
    'OPERACIONES': 'Operaciones',
    'VENTAS_JUNIOR': 'Ventas Junior',
    'GERENTE_ARGENTINA': 'Gerente Argentina'
  };
  return roleMap[role] || role; // si no está en el mapa, devuelve tal cual
}


  getUserInitials(): string {
    const user = this.getCurrentUser();
    if (user?.name) {
      return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
    }
    return 'U';
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  logout(): void {
    this.authService.logout();
    this.showUserMenu = false;
    this.router.navigate(['/auth/login']);
  }
}
