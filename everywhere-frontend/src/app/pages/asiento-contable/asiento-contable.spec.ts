import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsientoContable } from './asiento-contable';

describe('AsientoContable', () => {
  let component: AsientoContable;
  let fixture: ComponentFixture<AsientoContable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsientoContable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsientoContable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
