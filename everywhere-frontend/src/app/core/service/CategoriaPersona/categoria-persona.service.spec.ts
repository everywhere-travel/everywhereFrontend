/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { CategoriaPersonaService } from './categoria-persona.service';

describe('Service: CategoriaPersona', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CategoriaPersonaService]
    });
  });

  it('should ...', inject([CategoriaPersonaService], (service: CategoriaPersonaService) => {
    expect(service).toBeTruthy();
  }));
});
