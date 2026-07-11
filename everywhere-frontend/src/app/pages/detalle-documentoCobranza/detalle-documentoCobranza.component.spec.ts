import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DetalleDocumentoCobranzaComponent } from './detalle-documentoCobranza.component';

describe('DetalleDocumentoCobranzaComponent', () => {
  let component: DetalleDocumentoCobranzaComponent;
  let fixture: ComponentFixture<DetalleDocumentoCobranzaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
      imports: [
        DetalleDocumentoCobranzaComponent, // Para standalone components
        HttpClientTestingModule,
        RouterTestingModule,
        NoopAnimationsModule
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DetalleDocumentoCobranzaComponent);
    component = fixture.componentInstance;
    // Evitamos llamar a detectChanges inmediatamente para no detonar llamadas a servicios reales sin mockear
    // fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
