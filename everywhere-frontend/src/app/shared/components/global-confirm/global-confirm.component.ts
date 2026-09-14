import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConfirmService, ConfirmState } from '../../../core/service/confirm/confirm.service';
import { ConfirmationModalComponent, ConfirmationConfig } from '../confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-global-confirm',
  standalone: true,
  imports: [CommonModule, ConfirmationModalComponent],
  template: `
    <app-confirmation-modal
      *ngIf="show"
      [show]="show"
      [config]="config"
      (confirmed)="onConfirmed()"
      (cancelled)="onCancelled()"
    ></app-confirmation-modal>
  `
})
export class GlobalConfirmComponent implements OnInit, OnDestroy {
  show = false;
  config: ConfirmationConfig = { title: '', message: '' };
  private subscription = new Subscription();

  constructor(private confirmService: ConfirmService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.confirmService.confirmState$.subscribe((state: ConfirmState) => {
        this.show = state.show;
        if (state.config) {
          this.config = state.config;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onConfirmed(): void {
    this.confirmService.respond(true);
  }

  onCancelled(): void {
    this.confirmService.respond(false);
  }
}
