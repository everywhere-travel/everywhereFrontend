import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthServiceService } from '../../../core/service/auth/auth.service';
import { Module, Permission } from '../../models/role.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class NavbarComponent implements OnInit, OnDestroy {
  isMobileMenuOpen = false;
  currentUser: { name: string; role: string; displayRole: string } | null = null;
  private subscription = new Subscription();

  constructor(
    private authService: AuthServiceService,
    private router: Router
  ) {}

  ngOnInit() {
    // Suscribimos al usuario actual
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          this.currentUser = {
            name: user.name,
            role: user.role,
            displayRole: this.getRoleDisplayName(user.role)
          };
        } else {
          this.currentUser = null;
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  // Map de roles legibles
  private getRoleDisplayName(role: string): string {
    const roleMap: { [key: string]: string } = {
      'GERENTE': 'Gerente',
      'VENTAS': 'Ventas',
      'ADMINISTRAR': 'Administrar',
      'ADMIN': 'Administrador',
      'SISTEMAS': 'Sistemas',
      'OPERACIONES': 'Operaciones',
      'VENTAS_JUNIOR': 'Ventas Junior',
      'GERENTE_ARGENTINA': 'Gerente Argentina'
    };
    return roleMap[role] || role;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
