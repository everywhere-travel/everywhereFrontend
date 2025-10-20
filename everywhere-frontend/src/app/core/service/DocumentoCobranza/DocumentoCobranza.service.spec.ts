/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { DocumentoCobranzaService } from './DocumentoCobranza.service';

describe('Service: DocumentoCobranza', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DocumentoCobranzaService]
    });
  });

  it('should ...', inject([DocumentoCobranzaService], (service: DocumentoCobranzaService) => {
    expect(service).toBeTruthy();
  }));
});
