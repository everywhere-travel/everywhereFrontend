import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthServiceService } from '../../core/service/auth/auth.service';
import { UserService } from '../../core/service/User/user.service';
import { UserProfileResponse } from '../../shared/models/user/user-profile.model';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private authService = inject(AuthServiceService);
  private menuConfigService = inject(MenuConfigService);
  private router = inject(Router);
  private subscription = new Subscription();

  sidebarCollapsed = false;
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

  profile: UserProfileResponse | null = null;
  profileForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]]
  });

  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/profile');
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: ExtendedSidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.subscription.add(
      this.userService.getCurrentProfile().subscribe({
        next: (profile) => {
          this.profile = profile;
          this.profileForm.patchValue({
            name: profile?.name || ''
          });
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'No se pudo cargar la información del usuario.';
          this.isLoading = false;
        }
      })
    );
  }

  saveName(): void {
    if (this.profileForm.invalid || this.isSaving) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const name = this.profileForm.value.name?.trim();
    this.subscription.add(
      this.userService.updateCurrentName({ name }).subscribe({
        next: (profile) => {
          this.profile = profile;
          this.authService.updateCurrentUserName(profile.name);
          this.successMessage = 'Nombre actualizado correctamente.';
          this.isSaving = false;
        },
        error: () => {
          this.errorMessage = 'No se pudo actualizar el nombre.';
          this.isSaving = false;
        }
      })
    );
  }

  get roleLabel(): string {
    return this.profile?.role || this.authService.getRole() || 'Sin rol';
  }

  get sucursalLabel(): string {
    return this.profile?.sucursal?.descripcion || 'Sin sucursal asignada';
  }

}
