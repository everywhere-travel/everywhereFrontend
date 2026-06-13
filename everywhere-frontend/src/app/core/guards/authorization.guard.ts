import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthorizationService } from '../service/authorization.service';
import { ActionKey } from '../../shared/models/role.model';

/**
 * Guard que verifica acceso a un módulo con una acción específica.
 *
 * Uso en routes:
 * {
 *   path: 'productos',
 *   canActivate: [ModuleAccessGuard],
 *   data: { requiredModule: 'PRODUCTOS', requiredAction: 'READ' }
 * }
 */
@Injectable({
  providedIn: 'root'
})
export class ModuleAccessGuard implements CanActivate {

  constructor(
    private authorizationService: AuthorizationService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.authorizationService.getCurrentUser()) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    const requiredModule = route.data['requiredModule'] as string;
    const requiredAction = (route.data['requiredAction'] as ActionKey) ?? 'READ';

    // Sin módulo requerido → ruta pública autenticada
    if (!requiredModule) {
      return true;
    }

    if (this.authorizationService.canAccess(requiredModule, requiredAction)) {
      return true;
    }

    this.router.navigate(['/dashboard'], {
      queryParams: {
        error: 'access-denied',
        module: requiredModule,
        action: requiredAction
      }
    });
    return false;
  }
}

/**
 * Guard que solo permite acceso a administradores (ALL_MODULES:DELETE).
 */
@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authorizationService: AuthorizationService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
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