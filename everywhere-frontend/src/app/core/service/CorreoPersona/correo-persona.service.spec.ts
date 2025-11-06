/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { CorreoPersonaService } from './correo-persona.service';

describe('Service: CorreoPersona', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CorreoPersonaService]
    });
  });

  it('should ...', inject([CorreoPersonaService], (service: CorreoPersonaService) => {
    expect(service).toBeTruthy();
  }));
});
