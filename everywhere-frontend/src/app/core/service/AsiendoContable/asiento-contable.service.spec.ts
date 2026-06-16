import { TestBed } from '@angular/core/testing';

import { AsientoContableService } from './asiento-contable.service';

describe('AsientoContableService', () => {
  let service: AsientoContableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AsientoContableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
