/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { NaturalJuridicoService } from './natural-juridico.service';

describe('Service: NaturalJuridico', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NaturalJuridicoService]
    });
  });

  it('should ...', inject([NaturalJuridicoService], (service: NaturalJuridicoService) => {
    expect(service).toBeTruthy();
  }));
});
