import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface WelcomeBannerData {
  title: string;
  subtitle: string;
}

@Component({
  selector: 'app-welcome-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './welcome-banner.component.html',
  styleUrls: ['./welcome-banner.component.css']
})
export class WelcomeBannerComponent {
  @Input() data!: WelcomeBannerData;
}
