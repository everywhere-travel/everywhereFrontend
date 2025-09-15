# Sistema de Autorización Frontend

## 📋 Descripción

Este sistema de autorización permite controlar el acceso a módulos y funcionalidades basándose en los roles definidos en el backend Spring Boot.

## 🚀 Cómo usar

### 1. Configurar el usuario actual

```typescript
// En tu servicio de autenticación después del login
constructor(private authorizationService: AuthorizationService) {}

// Después del login exitoso
onLoginSuccess(userResponse: any) {
  const user = {
    id: userResponse.id,
    email: userResponse.email,
    role: userResponse.role // Debe ser uno de los RoleType definidos
  };
  
  this.authorizationService.setCurrentUser(user);
}
```

### 2. Proteger rutas

Las rutas ya están configuradas en `app.routes.ts` con los guards necesarios:

```typescript
{
  path: 'personas',
  component: PersonasComponent,
  canActivate: [authGuard, ModuleAccessGuard],
  data: { 
    requiredModule: Module.PERSONAS,
    requiredPermission: Permission.READ 
  }
}
```

### 3. Usar directivas en templates

#### Mostrar elementos basándose en acceso a módulos:

```html
<!-- Solo usuarios con acceso al módulo PERSONAS verán este botón -->
<button *appHasModuleAccess="Module.PERSONAS" class="btn btn-primary">
  Ver Clientes
</button>

<!-- Solo usuarios con acceso al módulo COTIZACIONES verán esta sección -->
<div *appHasModuleAccess="Module.COTIZACIONES" class="cotizaciones-section">
  <h2>Cotizaciones</h2>
  <!-- Contenido de cotizaciones -->
</div>
```

#### Mostrar elementos basándose en permisos específicos:

```html
<!-- Solo usuarios con permiso CREATE verán este botón -->
<button *appHasPermission="Permission.CREATE" class="btn btn-success">
  <i class="fas fa-plus"></i> Nuevo Cliente
</button>

<!-- Solo usuarios con permiso DELETE verán este botón -->
<button *appHasPermission="Permission.DELETE" class="btn btn-danger">
  <i class="fas fa-trash"></i> Eliminar
</button>

<!-- Solo usuarios con permiso UPDATE verán este botón -->
<button *appHasPermission="Permission.UPDATE" class="btn btn-warning">
  <i class="fas fa-edit"></i> Editar
</button>
```

#### Combinar módulo y permiso:

```html
<!-- Solo usuarios que puedan crear cotizaciones verán este botón -->
<button *appCanAccess="Module.COTIZACIONES" 
        [appCanAccessPermission]="Permission.CREATE" 
        class="btn btn-primary">
  Nueva Cotización
</button>

<!-- Solo usuarios que puedan editar productos verán esta sección -->
<div *appCanAccess="Module.PRODUCTOS" 
     [appCanAccessPermission]="Permission.UPDATE" 
     class="edit-section">
  <!-- Formulario de edición -->
</div>
```

#### Mostrar elementos solo para administradores:

```html
<!-- Solo administradores y sistemas verán este panel -->
<div *appIsAdmin class="admin-panel">
  <h2>Panel de Administración</h2>
  <!-- Configuraciones de admin -->
</div>
```

#### Mostrar elementos basándose en roles específicos:

```html
<!-- Solo usuarios con rol VENTAS_ADMIN verán esto -->
<div *appHasRole="'VENTAS_ADMIN'" class="ventas-admin-section">
  Configuración de Ventas Admin
</div>

<!-- Usuarios con múltiples roles pueden ver esto -->
<div *appHasRole="['VENTAS_ADMIN', 'VENTAS_JUNIOR']" class="ventas-section">
  Módulo de Ventas
</div>
```

### 4. Usar en componentes TypeScript

```typescript
import { Component, OnInit } from '@angular/core';
import { AuthorizationService } from '../core/service/authorization.service';
import { Module, Permission } from '../shared/models/role.model';

@Component({
  selector: 'app-ejemplo',
  template: `
    <div>
      <h1>Mi Componente</h1>
      
      <!-- Usar directivas -->
      <button *appCanAccess="Module.PERSONAS" 
              [appCanAccessPermission]="Permission.CREATE"
              (click)="crearPersona()">
        Crear Cliente
      </button>
      
      <!-- Usar métodos del componente -->
      <button *ngIf="canCreatePersonas()" 
              (click)="crearPersona()">
        Crear Cliente (método)
      </button>
    </div>
  `
})
export class EjemploComponent implements OnInit {
  Module = Module; // Exponer para usar en template
  Permission = Permission; // Exponer para usar en template

  constructor(private authorizationService: AuthorizationService) {}

  ngOnInit() {
    // Verificar permisos al inicializar
    if (this.authorizationService.hasModuleAccess(Module.PERSONAS)) {
      console.log('Usuario tiene acceso a personas');
    }
  }

  // Métodos auxiliares
  canCreatePersonas(): boolean {
    return this.authorizationService.canAccess(Module.PERSONAS, Permission.CREATE);
  }

  canEditPersonas(): boolean {
    return this.authorizationService.canAccess(Module.PERSONAS, Permission.UPDATE);
  }

  canDeletePersonas(): boolean {
    return this.authorizationService.canAccess(Module.PERSONAS, Permission.DELETE);
  }

  isAdmin(): boolean {
    return this.authorizationService.isAdmin();
  }

  crearPersona() {
    if (this.canCreatePersonas()) {
      // Lógica para crear persona
      console.log('Creando persona...');
    } else {
      console.log('Sin permisos para crear persona');
    }
  }
}
```

### 5. Ejemplo completo en un componente

```typescript
// personas.component.ts
import { Component } from '@angular/core';
import { AuthorizationService } from '../../core/service/authorization.service';
import { Module, Permission } from '../../shared/models/role.model';
import { HasModuleAccessDirective, CanAccessDirective, HasPermissionDirective } from '../../shared/directives/authorization.directive';

@Component({
  selector: 'app-personas',
  standalone: true,
  imports: [
    CommonModule,
    HasModuleAccessDirective,
    CanAccessDirective,
    HasPermissionDirective
  ],
  template: `
    <div class="personas-container">
      <div class="header">
        <h1>Gestión de Clientes</h1>
        
        <!-- Solo usuarios con permiso CREATE pueden crear -->
        <button *appCanAccess="Module.PERSONAS" 
                [appCanAccessPermission]="Permission.CREATE"
                class="btn btn-primary" 
                (click)="crear()">
          <i class="fas fa-plus"></i> Nuevo Cliente
        </button>
      </div>

      <div class="toolbar">
        <!-- Botones de acciones según permisos -->
        <button *appHasPermission="Permission.UPDATE" 
                [disabled]="!selectedItems.length"
                class="btn btn-warning" 
                (click)="editarSeleccionados()">
          <i class="fas fa-edit"></i> Editar
        </button>

        <button *appHasPermission="Permission.DELETE" 
                [disabled]="!selectedItems.length"
                class="btn btn-danger" 
                (click)="eliminarSeleccionados()">
          <i class="fas fa-trash"></i> Eliminar
        </button>

        <!-- Solo admins pueden ver configuración avanzada -->
        <button *appIsAdmin 
                class="btn btn-secondary" 
                (click)="configuracionAvanzada()">
          <i class="fas fa-cog"></i> Configuración
        </button>
      </div>

      <!-- Lista de personas -->
      <div class="personas-grid">
        <div *ngFor="let persona of personas" class="persona-card">
          <div class="persona-info">
            <h3>{{ persona.nombre }}</h3>
            <p>{{ persona.email }}</p>
          </div>
          
          <div class="persona-actions">
            <!-- Botón editar solo si tiene permiso -->
            <button *appCanAccess="Module.PERSONAS" 
                    [appCanAccessPermission]="Permission.UPDATE"
                    class="btn btn-sm btn-warning" 
                    (click)="editar(persona)">
              <i class="fas fa-edit"></i>
            </button>

            <!-- Botón eliminar solo si tiene permiso -->
            <button *appCanAccess="Module.PERSONAS" 
                    [appCanAccessPermission]="Permission.DELETE"
                    class="btn btn-sm btn-danger" 
                    (click)="eliminar(persona)">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PersonasComponent {
  Module = Module;
  Permission = Permission;
  
  personas = [];
  selectedItems = [];

  constructor(private authorizationService: AuthorizationService) {}

  crear() {
    if (this.authorizationService.canAccess(Module.PERSONAS, Permission.CREATE)) {
      // Lógica para crear
    }
  }

  editar(persona: any) {
    if (this.authorizationService.canAccess(Module.PERSONAS, Permission.UPDATE)) {
      // Lógica para editar
    }
  }

  eliminar(persona: any) {
    if (this.authorizationService.canAccess(Module.PERSONAS, Permission.DELETE)) {
      // Lógica para eliminar
    }
  }
}
```

## 🔒 Roles y Permisos Disponibles

### Roles:
- `ADMIN`: Acceso completo a todos los módulos
- `VENTAS_ADMIN`: Gestión completa de ventas
- `VENTAS_JUNIOR`: Ventas con restricciones
- `ADMINISTRACION_ADMIN`: Administración con permisos amplios
- `ADMINISTRACION_JUNIOR`: Administración con restricciones
- `SISTEMAS`: Acceso técnico completo
- `CONTABILIDAD_ADMIN`: Contabilidad con permisos amplios
- `CONTABILIDAD_JUNIOR`: Contabilidad con restricciones

### Permisos:
- `READ`: Lectura
- `CREATE`: Creación
- `UPDATE`: Actualización
- `DELETE`: Eliminación

### Módulos:
- `COTIZACIONES`
- `PERSONAS`
- `LIQUIDACIONES`
- `VIAJEROS`
- `SISTEMA`
- `CONTABILIDAD`
- `ADMINISTRACION`
- `VENTAS`
- `USUARIOS`
- `PRODUCTOS`
- `PROVEEDORES`
- `SUCURSALES`

## 🚫 Comportamiento de Seguridad

- Si un usuario no tiene acceso a un módulo, la ruta será bloqueada y será redirigido al dashboard
- Los elementos del UI que no debería ver simplemente no aparecerán
- El navbar solo muestra los módulos a los que tiene acceso
- Los botones de acciones solo aparecen si tiene los permisos necesarios

## 📝 Notas Importantes

1. **Importar directivas**: Siempre importa las directivas en tus componentes standalone
2. **Exponer enums**: Expón los enums Module y Permission en tus componentes para usarlos en templates
3. **Validar en métodos**: Además de las directivas, valida permisos en métodos TypeScript para mayor seguridad
4. **Actualizar usuario**: No olvides llamar a `setCurrentUser()` después del login exitoso