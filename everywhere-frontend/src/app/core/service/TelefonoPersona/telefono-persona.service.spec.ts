/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { TelefonoPersonaService } from './telefono-persona.service';

describe('Service: TelefonoPersona', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TelefonoPersonaService]
    });
  });

  it('should ...', inject([TelefonoPersonaService], (service: TelefonoPersonaService) => {
    expect(service).toBeTruthy();
  }));
});
