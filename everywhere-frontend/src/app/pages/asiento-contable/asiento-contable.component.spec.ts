import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AsientoContable } from './asiento-contable';
import { MenuConfigService } from '../../core/service/menu/menu-config.service';
import { AsientoContableService } from '../../core/service/AsiendoContable/asiento-contable.service';
import { AuthServiceService } from '../../core/service/auth/auth.service';
import { of } from 'rxjs';

describe('AsientoContable', () => {
  let component: AsientoContable;
  let fixture: ComponentFixture<AsientoContable>;
  let mockMenuConfigService: jasmine.SpyObj<MenuConfigService>;
  let mockAsientoContableService: jasmine.SpyObj<AsientoContableService>;
  let mockAuthService: jasmine.SpyObj<AuthServiceService>;

  beforeEach(async () => {
    mockMenuConfigService = jasmine.createSpyObj('MenuConfigService', ['getMenuItems']);
    mockAsientoContableService = jasmine.createSpyObj('AsientoContableService', ['getAllAsientosContables', 'getByIdAsientoContable', 'anularAsientoContable']);
    mockAuthService = jasmine.createSpyObj('AuthServiceService', ['isAuthenticated', 'getRole', 'getUser', 'getCurrentUserId', 'hasPermission']);
    
    mockAsientoContableService.getAllAsientosContables.and.returnValue(of([]));
    mockMenuConfigService.getMenuItems.and.returnValue([]);

    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), 
        provideHttpClientTesting(),
        { provide: MenuConfigService, useValue: mockMenuConfigService },
        { provide: AsientoContableService, useValue: mockAsientoContableService },
        { provide: AuthServiceService, useValue: mockAuthService }
      ],
      imports: [
        AsientoContable,
        HttpClientTestingModule,
        RouterTestingModule,
        NoopAnimationsModule
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AsientoContable);
    component = fixture.componentInstance; 
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
