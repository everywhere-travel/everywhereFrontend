const fs = require('fs');
const path = require('path');

const componentsToTest = [
  { folder: 'cotizaciones', name: 'CotizacionesComponent', file: 'cotizaciones.component' },
  { folder: 'detalle-cotizacion', name: 'DetalleCotizacionComponent', file: 'detalle-cotizacion.component' },
  { folder: 'liquidaciones', name: 'LiquidacionesComponent', file: 'liquidaciones.component' },
  { folder: 'detalle-liquidacion', name: 'DetalleLiquidacionComponent', file: 'detalle-liquidacion.component' },
  { folder: 'documento-cobranza', name: 'DocumentoCobranzaComponent', file: 'documento-cobranza.component' },
  { folder: 'detalle-documentoCobranza', name: 'DetalleDocumentoCobranzaComponent', file: 'detalle-documentoCobranza.component' },
  { folder: 'recibo', name: 'ReciboComponent', file: 'recibo.component' },
  { folder: 'detalle-recibo', name: 'DetalleReciboComponent', file: 'detalle-recibo.component' },
  { folder: 'personas', name: 'PersonasComponent', file: 'personas.component' },
  { folder: 'detalle-persona', name: 'DetallePersonaComponent', file: 'detalle-persona.component' },
  { folder: 'detalle-juridico', name: 'DetalleJuridicoComponent', file: 'detalle-juridico.component' },
  { folder: 'asiento-contable', name: 'AsientoContableComponent', file: 'asiento-contable.component' },
  { folder: 'roles', name: 'RolesComponent', file: 'roles.component' }
];

const basePath = path.join(__dirname, 'src', 'app', 'pages');

componentsToTest.forEach(comp => {
  const dirPath = path.join(basePath, comp.folder);
  const specPath = path.join(dirPath, `${comp.file}.spec.ts`);
  
  const content = `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ${comp.name} } from './${comp.file}';

describe('${comp.name}', () => {
  let component: ${comp.name};
  let fixture: ComponentFixture<${comp.name}>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ${comp.name}, // Para standalone components
        HttpClientTestingModule,
        RouterTestingModule,
        BrowserAnimationsModule
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(${comp.name});
    component = fixture.componentInstance;
    // Evitamos llamar a detectChanges inmediatamente para no detonar llamadas a servicios reales sin mockear
    // fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
`;

  if (fs.existsSync(dirPath)) {
    fs.writeFileSync(specPath, content, 'utf8');
    console.log(`Generated: ${specPath}`);
  } else {
    console.log(`Directory not found: ${dirPath}`);
  }
});
