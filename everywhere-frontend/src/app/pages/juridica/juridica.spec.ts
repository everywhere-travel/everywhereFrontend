import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Juridica } from './juridica';

describe('Juridica', () => {
  let component: Juridica;
  let fixture: ComponentFixture<Juridica>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Juridica]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Juridica);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
