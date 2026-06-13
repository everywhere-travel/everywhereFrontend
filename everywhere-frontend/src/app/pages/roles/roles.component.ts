import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RoleService } from '../../core/service/Role/role.service';
import { PermissionService } from '../../core/service/Permission/permission.service';
import { RoleResponse, PermissionResponse, MODULE } from '../../shared/models/role.model';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent implements OnInit {
  private roleService = inject(RoleService);
  private permissionService = inject(PermissionService);
  private fb = inject(FormBuilder);

  roles = signal<RoleResponse[]>([]);
  permissions = signal<PermissionResponse[]>([]);
  selectedRole = signal<RoleResponse | null>(null);
  loading = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  // Modal control
  showRoleModal = signal(false);
  showPermModal = signal(false);
  isEditingRole = signal(false);

  roleForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]]
  });

  permForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(/^[A-Z_]+:[A-Z_]+$/)]],
    description: ['']
  });

  ngOnInit() {
    this.loadRoles();
    this.loadPermissions();
  }

  loadRoles() {
    this.loading.set(true);
    this.roleService.getAll().subscribe({
      next: data => { this.roles.set(data); this.loading.set(false); },
      error: () => { this.errorMsg.set('Error cargando roles'); this.loading.set(false); }
    });
  }

  loadPermissions() {
    this.permissionService.getAll().subscribe({
      next: data => this.permissions.set(data),
      error: () => this.errorMsg.set('Error cargando permisos')
    });
  }

  // ---- Roles CRUD ----

  openCreateRole() {
    this.isEditingRole.set(false);
    this.roleForm.reset();
    this.showRoleModal.set(true);
  }

  openEditRole(role: RoleResponse) {
    this.isEditingRole.set(true);
    this.roleForm.patchValue({ name: role.name });
    this.selectedRole.set(role);
    this.showRoleModal.set(true);
  }

  saveRole() {
    if (this.roleForm.invalid) return;
    const data = this.roleForm.value;
    const obs = this.isEditingRole()
      ? this.roleService.update(this.selectedRole()!.id, data)
      : this.roleService.create(data);

    obs.subscribe({
      next: () => { this.showRoleModal.set(false); this.loadRoles(); this.flash('Rol guardado correctamente'); },
      error: (err) => this.errorMsg.set(err.error?.message || 'Error guardando rol')
    });
  }

  deleteRole(id: number) {
    if (!confirm('¿Eliminar este rol? Los usuarios con este rol perderán acceso.')) return;
    this.roleService.delete(id).subscribe({
      next: () => { this.loadRoles(); this.flash('Rol eliminado'); },
      error: () => this.errorMsg.set('No se puede eliminar: el rol tiene usuarios asignados')
    });
  }

  selectRole(role: RoleResponse) {
    this.selectedRole.set(role);
  }

  // ---- Permisos CRUD ----

  openCreatePerm() {
    this.permForm.reset();
    this.showPermModal.set(true);
  }

  savePerm() {
    if (this.permForm.invalid) return;
    this.permissionService.create(this.permForm.value).subscribe({
      next: () => { this.showPermModal.set(false); this.loadPermissions(); this.flash('Permiso creado'); },
      error: (err) => this.errorMsg.set(err.error?.message || 'Error creando permiso')
    });
  }

  deletePerm(id: number) {
    if (!confirm('¿Eliminar este permiso? Los roles que lo tenían lo perderán.')) return;
    this.permissionService.delete(id).subscribe({
      next: () => { this.loadPermissions(); this.flash('Permiso eliminado'); },
      error: () => this.errorMsg.set('Error eliminando permiso')
    });
  }

  // ---- Asignación rol-permiso ----

  roleHasPerm(permName: string): boolean {
    return this.selectedRole()?.permissions?.includes(permName) ?? false;
  }

  getPermIdByName(name: string): number | undefined {
    return this.permissions().find(p => p.name === name)?.id;
  }

  togglePermission(perm: PermissionResponse) {
    const role = this.selectedRole();
    if (!role) return;

    const hasPerm = this.roleHasPerm(perm.name);
    const obs = hasPerm
      ? this.roleService.removePermission(role.id, perm.id)
      : this.roleService.addPermission(role.id, perm.id);

    obs.subscribe({
      next: updatedRole => {
        this.selectedRole.set(updatedRole);
        // Actualizar la lista de roles también
        this.roles.update(list => list.map(r => r.id === updatedRole.id ? updatedRole : r));
      },
      error: (err) => this.errorMsg.set(err.error?.message || 'Error actualizando permiso')
    });
  }

  // ---- Helpers ----

  groupPermsByModule(): { module: string; perms: PermissionResponse[] }[] {
    const groups = new Map<string, PermissionResponse[]>();
    this.permissions().forEach(p => {
      const [mod] = p.name.split(':');
      if (!groups.has(mod)) groups.set(mod, []);
      groups.get(mod)!.push(p);
    });
    return Array.from(groups.entries()).map(([module, perms]) => ({ module, perms }));
  }

  private flash(msg: string) {
    this.successMsg.set(msg);
    this.errorMsg.set('');
    setTimeout(() => this.successMsg.set(''), 3000);
  }

  closeRoleModal() { this.showRoleModal.set(false); }
  closePermModal() { this.showPermModal.set(false); }
}
