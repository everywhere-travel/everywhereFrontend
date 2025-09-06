import { TestBed } from '@angular/core/testing';

import { ObservacionLiquidacion } from './observacion-liquidacion';

describe('ObservacionLiquidacion', () => {
  let service: ObservacionLiquidacion;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ObservacionLiquidacion);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
