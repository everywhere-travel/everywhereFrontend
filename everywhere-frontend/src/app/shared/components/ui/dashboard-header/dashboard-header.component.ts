import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserAvatarComponent, UserData } from '../user-avatar/user-avatar.component';

export interface DashboardHeaderData {
  logoSrc: string;
  title: {
    main: string;
    secondary: string;
  };
  subtitle: string;
  userData: UserData;
  isLoading?: boolean;
}

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, UserAvatarComponent],
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.css']
})
export class DashboardHeaderComponent {
  @Input() data!: DashboardHeaderData;
  @Output() refreshClicked = new EventEmitter<void>();

  onRefreshClick(): void {
    this.refreshClicked.emit();
  }
}
