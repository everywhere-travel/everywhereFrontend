import { TestBed } from '@angular/core/testing';

import { PagoPaxService } from './pago-pax.service';

describe('PagoPaxService', () => {
  let service: PagoPaxService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PagoPaxService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
