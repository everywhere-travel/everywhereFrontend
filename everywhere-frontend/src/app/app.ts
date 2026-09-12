import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { GlobalConfirmComponent } from './shared/components/global-confirm/global-confirm.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, GlobalConfirmComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('everyWhere');
}
