import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthorizationService, MenuItemConfig } from '../../../core/service/authorization.service';
import { HasModuleAccessDirective, CanAccessDirective, HasPermissionDirective } from '../../directives/authorization.directive';
import { Module, Permission } from '../../models/role.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  imports: [
    CommonModule, 
    RouterModule, 
    HasModuleAccessDirective, 
    CanAccessDirective, 
    HasPermissionDirective
  ]
})
export class NavbarComponent implements OnInit, OnDestroy {
  isMobileMenuOpen = false;
  menuItems: MenuItemConfig[] = [];
  currentUser$ = null;
  
  // Exponer enums para usar en el template
  Module = Module;
  Permission = Permission;
  
  private subscription = new Subscription();

  constructor(
    private authorizationService: AuthorizationService
  ) {}

  ngOnInit() {
    this.loadMenuItems();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private loadMenuItems() {
    this.menuItems = this.authorizationService.getFilteredMenuItems();
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  logout() {
    console.log('Cerrar sesión');
    this.authorizationService.clearUser();
    // aquí va la lógica real de logout
  }

  // Métodos auxiliares para el template
  hasModuleAccess(module: Module): boolean {
    return this.authorizationService.hasModuleAccess(module);
  }

  canAccess(module: Module, permission: Permission = Permission.READ): boolean {
    return this.authorizationService.canAccess(module, permission);
  }
}
