import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  imports: [CommonModule, RouterModule]  // 👈 necesarios
})
export class NavbarComponent {
  isMobileMenuOpen = false;
  currentUser$ = null; // Aquí luego inyectas tu AuthService

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  logout() {
    console.log('Cerrar sesión');
    // aquí va la lógica real de logout
  }
}
