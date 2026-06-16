import { TestBed } from '@angular/core/testing';

import { CuentaContableService } from './cuenta-contable.service';

describe('CuentaContableService', () => {
  let service: CuentaContableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CuentaContableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
