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
      role: this.getRoleDisplayName(authData?.role || 'USER')
    };
  }

  private getRoleDisplayName(role: string): string {
    const roleMap: { [key: string]: string } = {
      'ADMIN': 'Gerencia General',
      'VENTAS_ADMIN': 'Ventas Principal',
      'VENTAS_JUNIOR': 'Ventas junior',
      'ADMINISTRACION_ADMIN': 'Administración principal',
      'ADMINISTRACION_JUNIOR': 'Administración junior',
      'CONTABILIDAD_ADMIN': 'Contabilidad principal',
      'CONTABILIDAD_JUNIOR': 'Contabilidad junior',
      'SISTEMAS': 'Sistemas',
      'USER': 'Usuario'
    };
    return roleMap[role] || 'Usuario';
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
