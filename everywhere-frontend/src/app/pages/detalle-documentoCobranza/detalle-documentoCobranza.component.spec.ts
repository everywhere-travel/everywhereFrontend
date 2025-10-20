/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { DetalleDocumentoCobranzaComponent } from './detalle-documentoCobranza.component';

describe('DetalleDocumentoCobranzaComponent', () => {
  let component: DetalleDocumentoCobranzaComponent;
  let fixture: ComponentFixture<DetalleDocumentoCobranzaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DetalleDocumentoCobranzaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetalleDocumentoCobranzaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
