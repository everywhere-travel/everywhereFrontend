import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StatusData {
  status: 'operational' | 'warning' | 'error' | 'maintenance';
  text: string;
  subtext?: string;
  showTime?: boolean;
  currentTime?: string;
}

@Component({
  selector: 'app-status-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-indicator.component.html',
  styleUrls: ['./status-indicator.component.css']
})
export class StatusIndicatorComponent {
  @Input() data!: StatusData;

  getStatusClass(): string {
    return `status-indicator ${this.data.status}`;
  }

  getCurrentTime(): string {
    if (this.data.currentTime) {
      return this.data.currentTime;
    }
    return new Date().toLocaleString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    });
  }
}
