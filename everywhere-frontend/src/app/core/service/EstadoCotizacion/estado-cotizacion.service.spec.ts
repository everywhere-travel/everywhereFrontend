import { TestBed } from '@angular/core/testing';

import { EstadoCotizacionService } from './estado-cotizacion.service';

describe('EstadoCotizacionService', () => {
  let service: EstadoCotizacionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EstadoCotizacionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
