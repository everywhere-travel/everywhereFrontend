import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Viajero } from './viajero';

describe('Viajero', () => {
  let component: Viajero;
  let fixture: ComponentFixture<Viajero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Viajero]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Viajero);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
