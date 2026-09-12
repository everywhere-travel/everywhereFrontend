import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ConfirmationConfig } from '../../../shared/components/confirmation-modal/confirmation-modal.component';

export interface ConfirmState {
  show: boolean;
  config?: ConfirmationConfig;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  private confirmStateSubject = new Subject<ConfirmState>();
  private resolveSubject = new Subject<boolean>();

  public confirmState$ = this.confirmStateSubject.asObservable();

  constructor() {}

  /**
   * Muestra un modal de confirmación y retorna un Observable con la respuesta del usuario.
   * @param config Configuración del modal
   * @returns Observable que emite `true` si el usuario confirmó, `false` si canceló.
   */
  public confirm(config: ConfirmationConfig): Observable<boolean> {
    this.confirmStateSubject.next({ show: true, config });
    return this.resolveSubject.asObservable();
  }

  /**
   * Método llamado por el componente GlobalConfirm cuando el usuario interactúa.
   */
  public respond(result: boolean): void {
    this.resolveSubject.next(result);
    this.confirmStateSubject.next({ show: false });
  }
}
