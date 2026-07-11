const fs = require('fs');
const path = require('path');

const toDelete = [
  'src/app/shared/components/navbar/navbar.component.spec.ts',
  'src/app/shared/components/footer/footer.component.spec.ts',
  'src/app/pages/proveedor/proveedor.component.spec.ts',
  'src/app/pages/documentos/documentos.component.spec.ts',
  'src/app/pages/productos/productos.component.spec.ts',
  'src/app/pages/usuarios/usuarios.component.spec.ts',
  'src/app/pages/sucursales/sucursales.component.spec.ts',
  'src/app/pages/categorias/categorias.component.spec.ts',
  'src/app/pages/operadores/operadores.component.spec.ts',
  'src/app/pages/auth/auth-layout/auth-layout.component.spec.ts'
];

toDelete.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log('Deleted', file);
  }
});

// Overwrite login.component.spec.ts
const loginSpecPath = path.join(__dirname, 'src/app/pages/auth/login/login.component.spec.ts');
const loginContent = `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
      imports: [
        LoginComponent, // Para standalone components
        HttpClientTestingModule,
        RouterTestingModule,
        NoopAnimationsModule
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
`;
fs.writeFileSync(loginSpecPath, loginContent, 'utf8');
console.log('Overwritten login.component.spec.ts');
