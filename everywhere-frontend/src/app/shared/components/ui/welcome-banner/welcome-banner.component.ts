import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusIndicatorComponent, StatusData } from '../status-indicator/status-indicator.component';

export interface WelcomeBannerData {
  title: string;
  subtitle: string;
  statusData?: StatusData;
}

@Component({
  selector: 'app-welcome-banner',
  standalone: true,
  imports: [CommonModule, StatusIndicatorComponent],
  templateUrl: './welcome-banner.component.html',
  styleUrls: ['./welcome-banner.component.css']
})
export class WelcomeBannerComponent {
  @Input() data!: WelcomeBannerData;
}
