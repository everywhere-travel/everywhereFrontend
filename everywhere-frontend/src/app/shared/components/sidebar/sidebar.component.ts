import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthServiceService } from '../../../core/service/auth/auth.service';
import { ExchangeService } from '../../../core/service/exchange/exchange.service';
import { Exchange } from '../../models/Exchange/exchange.model';

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
export class SidebarComponent implements OnInit, OnChanges {
  @Input() isCollapsed = false;
  @Input() menuItems: SidebarMenuItem[] = [];
  @Output() itemClick = new EventEmitter<SidebarMenuItem>();
  @Output() toggleSidebar = new EventEmitter<void>();

  expandedItems: Set<string> = new Set();
  showUserMenu = false;

  // Exchange rate variables
  exchangeData: Exchange | null = null;
  isLoadingExchange = false;
  exchangeError = false;

  constructor(
    private authService: AuthServiceService,
    private router: Router,
    private exchangeService: ExchangeService
  ) { }

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

  /**
   * Auto-expand menu items that have active children
   * This ensures child routes are visible when navigating directly to them
   */
  private autoExpandActiveItems(): void {
    this.menuItems.forEach(item => {
      if (item.children && item.children.length > 0) {
        // Check if any child is active
        const hasActiveChild = item.children.some(child => child.active);
        if (hasActiveChild) {
          this.expandedItems.add(item.id);
        }
      }
    });
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

  // ========== EXCHANGE RATE METHODS ==========
  ngOnInit(): void {
    this.loadExchangeRateFromCache();
    this.autoExpandActiveItems();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Auto-expand when menuItems change
    if (changes['menuItems'] && this.menuItems) {
      this.autoExpandActiveItems();
    }
  }
  private loadExchangeRateFromCache(): void {
    const cachedData = localStorage.getItem('exchangeRateData');

    if (cachedData) {
      try {
        this.exchangeData = JSON.parse(cachedData);
        console.log('Tipo de cambio cargado desde cache');
      } catch (error) {
        console.error('Error al parsear cache de tipo de cambio:', error);
        this.loadExchangeRate();
      }
    } else {
      this.loadExchangeRate();
    }
  }
  loadExchangeRate(): void {
    this.isLoadingExchange = true;
    this.exchangeError = false;

    this.exchangeService.getExchangeRates().subscribe({
      next: (data) => {
        this.exchangeData = data;
        this.isLoadingExchange = false;

        try {
          localStorage.setItem('exchangeRateData', JSON.stringify(data));
          console.log('Tipo de cambio actualizado y guardado en cache');
        } catch (error) {
          console.error('Error al guardar tipo de cambio en cache:', error);
        }
      },
      error: (error) => {
        console.error('Error al cargar tipo de cambio:', error);
        this.exchangeError = true;
        this.isLoadingExchange = false;
      }
    });
  }
  refreshExchangeRate(): void {
    this.loadExchangeRate();
  }
}
