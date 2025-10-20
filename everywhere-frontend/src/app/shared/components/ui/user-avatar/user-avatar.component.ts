import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthServiceService } from '../../../../core/service/auth/auth.service';

export interface UserData {
  name: string;
  role: string;
  avatar?: string; // URL de la imagen del avatar (opcional)
}

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.css']
})
export class UserAvatarComponent implements OnInit {
  @Input() user!: UserData;
  @Input() showInfo: boolean = true;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Output() logoutClicked = new EventEmitter<void>();

  showUserMenu = false;
  currentUser: any = null;
  userRole: string = '';

  constructor(private authService: AuthServiceService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    const rawRole = String(this.authService.getRole() || '');
    this.userRole = this.getRoleDisplayName(rawRole);
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
    const name = this.currentUser?.name || this.currentUser?.email || this.user?.name;
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getSizeClass(): string {
    return `user-avatar-${this.size}`;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  onLogout(): void {
    this.logoutClicked.emit();
    this.showUserMenu = false;
  }
}
