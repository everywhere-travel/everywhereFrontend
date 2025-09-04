import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthServiceService } from '../../../core/services/auth/auth.service';
import { AuthRequest } from '../../../models/auth/auth-request-model';
import { AuthResponse } from '../../../models/auth/auth-response-model';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthServiceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      this.errorMessage = 'Por favor complete todos los campos correctamente';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const authRequest: AuthRequest = {
      email: this.loginForm.value.username, // El campo email se llena con el username del form
      password: this.loginForm.value.password
    };

    this.authService.login(authRequest).subscribe({
      next: (response: AuthResponse) => {
        console.log('Login exitoso:', response);
        // Redirigir al dashboard después del login exitoso
        this.router.navigate(['/dashboard']);
      },
      error: (error: any) => {
        console.error('Error en login:', error);
        this.isLoading = false;
        
        // Manejar diferentes tipos de errores
        if (error.status === 401) {
          this.errorMessage = 'Usuario o contraseña incorrectos';
        } else if (error.status === 0) {
          this.errorMessage = 'Error de conexión. Verifique su conexión a internet';
        } else {
          this.errorMessage = 'Error interno del servidor. Intente nuevamente';
        }
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  // Métodos de utilidad para el template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} es requerido`;
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldDisplayName(fieldName)} debe tener al menos ${requiredLength} caracteres`;
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      username: 'El usuario',
      password: 'La contraseña'
    };
    return displayNames[fieldName] || fieldName;
  }
}
