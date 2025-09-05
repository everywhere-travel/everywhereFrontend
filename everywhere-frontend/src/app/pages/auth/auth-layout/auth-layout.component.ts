import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `<div class="auth-layout"><router-outlet></router-outlet></div>`,
  styleUrl: './auth-layout.component.css'
})
export class AuthLayoutComponent {

}
