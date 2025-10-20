/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { DetalleDocumentoCobranzaService } from './detalle-documentoCobranza.service';

describe('Service: DetalleDocumentoCobranza', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DetalleDocumentoCobranzaService]
    });
  });

  it('should ...', inject([DetalleDocumentoCobranzaService], (service: DetalleDocumentoCobranzaService) => {
    expect(service).toBeTruthy();
  }));
});
