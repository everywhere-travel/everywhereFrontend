import { TestBed } from '@angular/core/testing';

import { DetalleCotizacionService } from './detalle-cotizacion.service';

describe('DetalleCotizacionService', () => {
  let service: DetalleCotizacionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetalleCotizacionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
