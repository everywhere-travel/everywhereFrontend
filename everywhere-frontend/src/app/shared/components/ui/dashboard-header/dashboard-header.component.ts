import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserAvatarComponent, UserData } from '../user-avatar/user-avatar.component';
import { StatusIndicatorComponent, StatusData } from '../status-indicator/status-indicator.component';

export interface DashboardHeaderData {
  logoSrc: string;
  title: {
    main: string;
    secondary: string;
  };
  subtitle: string;
  statusData: StatusData;
  userData: UserData;
  isLoading?: boolean;
}

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, UserAvatarComponent, StatusIndicatorComponent],
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
