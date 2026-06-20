import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Services
import { UserService } from '../../core/service/User/user.service';
import { RoleService } from '../../core/service/Role/role.service';
import { PermissionService } from '../../core/service/Permission/permission.service';
import { AuthServiceService } from '../../core/service/auth/auth.service';
import { SucursalService } from '../../core/service/Sucursal/sucursal.service';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';

// Models
import { UsuarioResponse, UsuarioRequest } from '../../shared/models/Usuario/usuario.model';
import { RoleResponse, PermissionResponse, MODULE, ACTION, hasPermission, getAccessibleModules } from '../../shared/models/role.model';
import { SucursalResponse } from '../../shared/models/Sucursal/sucursal.model';

// Components
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';

export interface UsuarioTabla {
  id: number;
  nombre: string;
  email: string;
  roleId: number;
  roleName: string;
  sucursalId?: number;
  sucursalName: string;
  estado: boolean;
}

export interface PermissionMatrixRow {
  module: string;
  read?: PermissionResponse;
  create?: PermissionResponse;
  update?: PermissionResponse;
  delete?: PermissionResponse;
  other: PermissionResponse[];
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SidebarComponent
  ],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {

  // Sidebar Configuration
  sidebarCollapsed = false;
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

  // Data
  usuarios: UsuarioResponse[] = [];
  usuariosTabla: UsuarioTabla[] = [];
  roles: RoleResponse[] = [];
  permisos: PermissionResponse[] = [];
  sucursales: SucursalResponse[] = [];

  // UI State
  activeTab: 'usuarios' | 'roles' = 'usuarios';
  loading = false;
  
  // Usuario Modal
  mostrarModalUsuario = false;
  editandoUsuario = false;
  usuarioSeleccionadoId: number | null = null;
  usuarioForm!: FormGroup;

  // Role Modal / Permissions Management
  roleSeleccionado: RoleResponse | null = null;
  roleSeleccionadoPermisos: Set<number> = new Set();
  permissionMatrix: PermissionMatrixRow[] = [];
  
  // Role CRUD Modal
  mostrarModalRol = false;
  editandoRol = false;
  rolSeleccionadoIdParaEdicion: number | null = null;
  rolForm!: FormGroup;
  
  // Filtros
  searchTermUsuarios = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private roleService: RoleService,
    private permissionService: PermissionService,
    private sucursalService: SucursalService,
    private authService: AuthServiceService,
    private menuConfigService: MenuConfigService,
    private router: Router
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/usuarios');
    this.loadInitialData();
  }

  private initializeForms(): void {
    this.usuarioForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: [''], // Opcional, si está vacío se usa "123456" al crear o se ignora al editar
      roleId: ['', Validators.required],
      sucursalId: ['']
    });

    this.rolForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]]
    });
  }

  private loadInitialData(): void {
    this.loading = true;
    Promise.all([
      this.roleService.getAll().toPromise().catch(() => []),
      this.permissionService.getAll().toPromise().catch(() => []),
      this.sucursalService.getDropdownSucursales().toPromise().catch(() => [])
    ]).then(([rolesRes, permisosRes, sucursalesRes]) => {
      this.roles = rolesRes || [];
      this.permisos = permisosRes || [];
      this.sucursales = sucursalesRes || [];
      this.buildPermissionMatrix();
      this.loadUsuarios();
    }).catch(err => {
      console.error('Error inesperado', err);
      this.loadUsuarios(); // Intentar cargar usuarios de todos modos
    });
  }

  private loadUsuarios(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.transformarDataParaTabla();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando usuarios', err);
        this.loading = false;
        alert('Error al cargar la lista de usuarios. Asegúrate de haber reiniciado el backend. Detalle: ' + (err.message || err.statusText || 'Error interno'));
      }
    });
  }

  private transformarDataParaTabla(): void {
    this.usuariosTabla = this.usuarios.map(u => ({
      id: u.id,
      nombre: u.nombre || 'Sin nombre',
      email: u.email || 'Sin email',
      roleId: u.role?.id || 0,
      roleName: u.role?.name || 'Sin rol',
      sucursalId: u.sucursal?.id,
      sucursalName: u.sucursal?.descripcion || 'Sin sucursal',
      estado: u.estado ?? true
    }));
  }

  get filteredUsuarios(): UsuarioTabla[] {
    if (!this.searchTermUsuarios) {
      return this.usuariosTabla;
    }
    const term = this.searchTermUsuarios.toLowerCase();
    return this.usuariosTabla.filter(u => 
      u.nombre.toLowerCase().includes(term) || 
      u.email.toLowerCase().includes(term) ||
      u.roleName.toLowerCase().includes(term)
    );
  }

  // ==========================================
  // Sidebar
  // ==========================================
  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: ExtendedSidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  switchTab(tab: 'usuarios' | 'roles'): void {
    this.activeTab = tab;
  }

  // ==========================================
  // Permisos Matrix Builder
  // ==========================================
  private buildPermissionMatrix(): void {
    const matrixMap = new Map<string, PermissionMatrixRow>();

    this.permisos.forEach(p => {
      const parts = p.name.split(':');
      if (parts.length >= 2) {
        const module = parts[0];
        const action = parts.slice(1).join(':');

        if (!matrixMap.has(module)) {
          matrixMap.set(module, { module, other: [] });
        }

        const row = matrixMap.get(module)!;

        switch (action) {
          case 'READ': row.read = p; break;
          case 'CREATE': row.create = p; break;
          case 'UPDATE': row.update = p; break;
          case 'DELETE': row.delete = p; break;
          default: row.other.push(p); break;
        }
      }
    });

    this.permissionMatrix = Array.from(matrixMap.values());
  }

  formatModuleName(moduleName: string): string {
    return moduleName.replace(/_/g, ' ')
                     .replace(/-/g, ' ')
                     .replace(/\b\w/g, l => l.toUpperCase());
  }

  // ==========================================
  // Gestión de Usuarios
  // ==========================================
  abrirModalCrearUsuario(): void {
    this.editandoUsuario = false;
    this.usuarioSeleccionadoId = null;
    this.usuarioForm.reset({
      nombre: '',
      email: '',
      password: '',
      roleId: '',
      sucursalId: ''
    });
    this.mostrarModalUsuario = true;
  }

  editarUsuario(usuario: UsuarioTabla): void {
    this.editandoUsuario = true;
    this.usuarioSeleccionadoId = usuario.id;
    this.usuarioForm.patchValue({
      nombre: usuario.nombre,
      email: usuario.email,
      password: '',
      roleId: usuario.roleId,
      sucursalId: usuario.sucursalId || ''
    });
    this.mostrarModalUsuario = true;
  }

  cerrarModalUsuario(): void {
    this.mostrarModalUsuario = false;
  }

  guardarUsuario(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    const formValues = this.usuarioForm.value;
    const request: UsuarioRequest = {
      nombre: formValues.nombre,
      email: formValues.email,
      password: formValues.password,
      roleId: Number(formValues.roleId),
      sucursalId: formValues.sucursalId ? Number(formValues.sucursalId) : undefined
    };

    this.loading = true;

    if (this.editandoUsuario && this.usuarioSeleccionadoId) {
      this.userService.updateUser(this.usuarioSeleccionadoId, request).subscribe({
        next: () => {
          this.loadUsuarios();
          this.cerrarModalUsuario();
        },
        error: (err) => {
          console.error('Error actualizando usuario', err);
          this.loading = false;
          alert('Error: ' + (err.error?.message || 'No se pudo actualizar el usuario'));
        }
      });
    } else {
      this.userService.createUser(request).subscribe({
        next: () => {
          this.loadUsuarios();
          this.cerrarModalUsuario();
        },
        error: (err) => {
          console.error('Error creando usuario', err);
          this.loading = false;
          alert('Error: ' + (err.error?.message || 'No se pudo crear el usuario'));
        }
      });
    }
  }

  eliminarUsuario(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      this.loading = true;
      this.userService.deleteUser(id).subscribe({
        next: () => this.loadUsuarios(),
        error: (err) => {
          console.error('Error eliminando usuario', err);
          this.loading = false;
          alert('Error al eliminar usuario');
        }
      });
    }
  }

  toggleEstadoUsuario(id: number, currentEstado: boolean): void {
    const accion = currentEstado ? 'deshabilitar' : 'habilitar';
    if (confirm(`¿Estás seguro de que deseas ${accion} este usuario?`)) {
      this.loading = true;
      this.userService.toggleUserStatus(id).subscribe({
        next: () => this.loadUsuarios(),
        error: (err) => {
          console.error('Error cambiando estado del usuario', err);
          this.loading = false;
          alert('Error al cambiar el estado del usuario');
        }
      });
    }
  }

  // ==========================================
  // Gestión de Roles y Permisos
  // ==========================================
  seleccionarRole(role: RoleResponse): void {
    this.roleSeleccionado = role;
    // Identificar los IDs de los permisos que tiene el rol
    this.roleSeleccionadoPermisos.clear();
    
    // Los permisos en RoleResponse vienen como un array de strings (ej: "CLIENTES:READ").
    // Necesitamos mapearlos a IDs basados en la lista this.permisos
    if (role.permissions && role.permissions.length > 0) {
      role.permissions.forEach(permString => {
        const p = this.permisos.find(x => x.name === permString);
        if (p) {
          this.roleSeleccionadoPermisos.add(p.id);
        }
      });
    }
  }

  togglePermission(permiso: PermissionResponse): void {
    if (!this.roleSeleccionado) return;

    this.loading = true;
    const hasPerm = this.roleSeleccionadoPermisos.has(permiso.id);

    if (hasPerm) {
      this.roleService.removePermission(this.roleSeleccionado.id, permiso.id).subscribe({
        next: (updatedRole) => {
          this.roleSeleccionadoPermisos.delete(permiso.id);
          this.updateRoleInList(updatedRole);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error quitando permiso', err);
          this.loading = false;
        }
      });
    } else {
      this.roleService.addPermission(this.roleSeleccionado.id, permiso.id).subscribe({
        next: (updatedRole) => {
          this.roleSeleccionadoPermisos.add(permiso.id);
          this.updateRoleInList(updatedRole);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error agregando permiso', err);
          this.loading = false;
        }
      });
    }
  }

  private updateRoleInList(updatedRole: RoleResponse): void {
    const idx = this.roles.findIndex(r => r.id === updatedRole.id);
    if (idx !== -1) {
      this.roles[idx] = updatedRole;
      this.roleSeleccionado = updatedRole;
    }
  }

  hasPermissionChecked(permisoId: number): boolean {
    return this.roleSeleccionadoPermisos.has(permisoId);
  }

  // ==========================================
  // Gestión de Roles (CRUD)
  // ==========================================
  abrirModalCrearRol(): void {
    this.editandoRol = false;
    this.rolSeleccionadoIdParaEdicion = null;
    this.rolForm.reset({ name: '' });
    this.mostrarModalRol = true;
  }

  editarRol(role: RoleResponse, event: Event): void {
    event.stopPropagation();
    this.editandoRol = true;
    this.rolSeleccionadoIdParaEdicion = role.id;
    this.rolForm.patchValue({ name: role.name });
    this.mostrarModalRol = true;
  }

  cerrarModalRol(): void {
    this.mostrarModalRol = false;
  }

  guardarRol(): void {
    if (this.rolForm.invalid) {
      this.rolForm.markAllAsTouched();
      return;
    }

    const request = { name: this.rolForm.value.name.toUpperCase() };
    this.loading = true;

    if (this.editandoRol && this.rolSeleccionadoIdParaEdicion) {
      this.roleService.update(this.rolSeleccionadoIdParaEdicion, request).subscribe({
        next: () => {
          this.loadRoles();
          this.cerrarModalRol();
        },
        error: (err) => {
          console.error('Error actualizando rol', err);
          this.loading = false;
          alert('Error: ' + (err.error?.message || 'No se pudo actualizar el rol'));
        }
      });
    } else {
      this.roleService.create(request).subscribe({
        next: () => {
          this.loadRoles();
          this.cerrarModalRol();
        },
        error: (err) => {
          console.error('Error creando rol', err);
          this.loading = false;
          alert('Error: ' + (err.error?.message || 'No se pudo crear el rol'));
        }
      });
    }
  }

  eliminarRol(id: number, event: Event): void {
    event.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar este rol? Se perderán sus permisos.')) {
      this.loading = true;
      this.roleService.delete(id).subscribe({
        next: () => {
          if (this.roleSeleccionado?.id === id) {
            this.roleSeleccionado = null;
            this.roleSeleccionadoPermisos.clear();
          }
          this.loadRoles();
        },
        error: (err) => {
          console.error('Error eliminando rol', err);
          this.loading = false;
          alert('Error al eliminar rol');
        }
      });
    }
  }

  private loadRoles(): void {
    this.loading = true;
    this.roleService.getAll().subscribe({
      next: (roles) => {
        this.roles = roles || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando roles', err);
        this.loading = false;
      }
    });
  }
}
