import { TestBed } from '@angular/core/testing';

import { DetalleDocumento } from './detalle-documento';

describe('DetalleDocumento', () => {
  let service: DetalleDocumento;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetalleDocumento);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
