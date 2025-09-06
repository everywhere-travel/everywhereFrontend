import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

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
export class UserAvatarComponent {
  @Input() user!: UserData;
  @Input() showInfo: boolean = true;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  getUserInitials(): string {
    if (!this.user?.name) return 'U';
    return this.user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getSizeClass(): string {
    return `user-avatar-${this.size}`;
  }
}
