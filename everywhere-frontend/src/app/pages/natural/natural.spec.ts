import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Natural } from './natural';

describe('Natural', () => {
  let component: Natural;
  let fixture: ComponentFixture<Natural>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Natural]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Natural);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
