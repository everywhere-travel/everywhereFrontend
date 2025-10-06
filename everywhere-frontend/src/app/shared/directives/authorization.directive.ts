import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthorizationService } from '../../core/service/authorization.service';
import { Module, Permission } from '../models/role.model';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  @Input() appHasPermission!: Permission;
  
  private subscription: Subscription = new Subscription();

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authorizationService: AuthorizationService
  ) {}

  ngOnInit() {
    this.updateView();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private updateView() {
    if (this.authorizationService.hasPermission(this.appHasPermission)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}

@Directive({
  selector: '[appHasModuleAccess]',
  standalone: true
})
export class HasModuleAccessDirective implements OnInit, OnDestroy {
  @Input() appHasModuleAccess!: Module;
  
  private subscription: Subscription = new Subscription();

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authorizationService: AuthorizationService
  ) {}

  ngOnInit() {
    this.updateView();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private updateView() {
    if (this.authorizationService.hasModuleAccess(this.appHasModuleAccess)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}

@Directive({
  selector: '[appCanAccess]',
  standalone: true
})
export class CanAccessDirective implements OnInit, OnDestroy {
  @Input() appCanAccessModule!: Module;
  @Input() appCanAccessPermission: Permission = Permission.READ;
  
  private subscription: Subscription = new Subscription();

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authorizationService: AuthorizationService
  ) {}

  ngOnInit() {
    this.updateView();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private updateView() {
    if (this.authorizationService.canAccess(this.appCanAccessModule, this.appCanAccessPermission)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}

@Directive({
  selector: '[appIsAdmin]',
  standalone: true
})
export class IsAdminDirective implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription();

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authorizationService: AuthorizationService
  ) {}

  ngOnInit() {
    this.updateView();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private updateView() {
    if (this.authorizationService.isAdmin()) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit, OnDestroy {
  @Input() appHasRole!: string | string[];
  
  private subscription: Subscription = new Subscription();

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authorizationService: AuthorizationService
  ) {}

  ngOnInit() {
    this.updateView();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private updateView() {
    const currentUser = this.authorizationService.getCurrentUser();
    if (!currentUser) {
      this.viewContainer.clear();
      return;
    }

    const rolesToCheck = Array.isArray(this.appHasRole) ? this.appHasRole : [this.appHasRole];
    const hasRole = rolesToCheck.includes(currentUser.role);

    if (hasRole) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}