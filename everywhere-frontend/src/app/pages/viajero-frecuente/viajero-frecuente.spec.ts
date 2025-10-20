import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViajeroFrecuente } from './viajero-frecuente';

describe('ViajeroFrecuente', () => {
  let component: ViajeroFrecuente;
  let fixture: ComponentFixture<ViajeroFrecuente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViajeroFrecuente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViajeroFrecuente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
