import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthorizationService } from '../service/authorization.service';
import { Module, Permission } from '../../shared/models/role.model';

@Injectable({
  providedIn: 'root'
})
export class ModuleAccessGuard implements CanActivate {
  
  constructor(
    private authorizationService: AuthorizationService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const requiredModule = route.data['requiredModule'] as Module;
    const requiredPermission = route.data['requiredPermission'] as Permission || Permission.READ;

    // Si no hay usuario logueado, redirigir al login
    if (!this.authorizationService.getCurrentUser()) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    // Si no se requiere módulo específico, permitir acceso
    if (!requiredModule) {
      return true;
    }

    // Verificar acceso al módulo y permiso
    if (this.authorizationService.canAccess(requiredModule, requiredPermission)) {
      return true;
    }

    // Si no tiene acceso, redirigir al dashboard o página de acceso denegado
    this.router.navigate(['/dashboard'], { 
      queryParams: { 
        error: 'access-denied',
        module: requiredModule,
        permission: requiredPermission 
      } 
    });
    return false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  
  constructor(
    private authorizationService: AuthorizationService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (!this.authorizationService.getCurrentUser()) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    if (this.authorizationService.isAdmin()) {
      return true;
    }

    this.router.navigate(['/dashboard'], { 
      queryParams: { error: 'admin-required' } 
    });
    return false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  
  constructor(
    private authorizationService: AuthorizationService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const requiredPermission = route.data['requiredPermission'] as Permission;

    if (!this.authorizationService.getCurrentUser()) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    if (!requiredPermission) {
      return true;
    }

    if (this.authorizationService.hasPermission(requiredPermission)) {
      return true;
    }

    this.router.navigate(['/dashboard'], { 
      queryParams: { 
        error: 'permission-denied',
        permission: requiredPermission 
      } 
    });
    return false;
  }
}