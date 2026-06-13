import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { AuthorizationService } from '../../core/service/authorization.service';
import { ActionKey } from '../models/role.model';

/**
 * [appCanAccess]="'CLIENTES'" [appCanAccessAction]="'READ'"
 * Muestra el elemento si el usuario tiene ese permiso sobre ese módulo.
 */
@Directive({
  selector: '[appCanAccess]',
  standalone: true
})
export class CanAccessDirective implements OnInit, OnChanges {
  @Input() appCanAccess!: string;                        // Módulo: "CLIENTES", "COTIZACIONES", etc.
  @Input() appCanAccessAction: ActionKey = 'READ';       // Acción (default: READ)

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authorizationService: AuthorizationService
  ) {}

  ngOnInit() { this.updateView(); }
  ngOnChanges() { this.updateView(); }

  private updateView() {
    if (this.authorizationService.canAccess(this.appCanAccess, this.appCanAccessAction)) {
      if (this.viewContainer.length === 0) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    } else {
      this.viewContainer.clear();
    }
  }
}

/**
 * [appHasModuleAccess]="'CLIENTES'"
 * Muestra el elemento si el usuario tiene acceso de lectura al módulo.
 */
@Directive({
  selector: '[appHasModuleAccess]',
  standalone: true
})
export class HasModuleAccessDirective implements OnInit, OnChanges {
  @Input() appHasModuleAccess!: string;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authorizationService: AuthorizationService
  ) {}

  ngOnInit() { this.updateView(); }
  ngOnChanges() { this.updateView(); }

  private updateView() {
    if (this.authorizationService.hasModuleAccess(this.appHasModuleAccess)) {
      if (this.viewContainer.length === 0) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    } else {
      this.viewContainer.clear();
    }
  }
}

/**
 * [appIsAdmin]
 * Muestra el elemento solo si el usuario es administrador (ALL_MODULES:DELETE).
 */
@Directive({
  selector: '[appIsAdmin]',
  standalone: true
})
export class IsAdminDirective implements OnInit {
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authorizationService: AuthorizationService
  ) {}

  ngOnInit() {
    if (this.authorizationService.isAdmin()) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}

/**
 * [appHasRole]="'GERENTE'" o [appHasRole]="['ADMIN', 'SISTEMAS']"
 * Muestra el elemento si el usuario tiene uno de esos roles.
 */
@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit {
  @Input() appHasRole!: string | string[];

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authorizationService: AuthorizationService
  ) {}

  ngOnInit() {
    const currentUser = this.authorizationService.getCurrentUser();
    if (!currentUser) {
      this.viewContainer.clear();
      return;
    }

    const rolesToCheck = Array.isArray(this.appHasRole) ? this.appHasRole : [this.appHasRole];
    const hasRole = rolesToCheck.some(r => r.toUpperCase() === currentUser.role?.toUpperCase());

    if (hasRole) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}

// Re-export alias para compatibilidad con código que use HasPermissionDirective
export { CanAccessDirective as HasPermissionDirective };