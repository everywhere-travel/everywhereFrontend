import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthServiceService } from '../../../core/service/auth/auth.service';
import { AuthRequest } from '../../../shared/models/auth/auth-request-model';
import { AuthResponse } from '../../../shared/models/auth/auth-response-model';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  // Estado del modal de recuperación de contraseña
  showRecoveryModal = false;
  recoveryStep: 1 | 2 | 3 = 1; // 1: Solicitar código, 2: Ingresar código y nueva clave, 3: Éxito
  recoveryEmail = '';
  recoveryCode = '';
  recoveryNewPassword = '';
  recoveryConfirmPassword = '';
  isSendingRecoveryCode = false;
  isResettingPassword = false;
  recoveryErrorMessage = '';
  recoverySuccessMessage = '';
  showRecoveryPassword = false;
  showRecoveryConfirmPassword = false;

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

  // Métodos para el modal de recuperación
  openRecoveryModal(): void {
    this.showRecoveryModal = true;
    this.recoveryStep = 1;
    // Pre-cargar con lo que el usuario haya escrito en el campo de usuario si parece correo
    const currentUsername = (this.loginForm.get('username')?.value || '').trim();
    if (currentUsername.includes('@')) {
      this.recoveryEmail = currentUsername;
    }
    this.recoveryCode = '';
    this.recoveryNewPassword = '';
    this.recoveryConfirmPassword = '';
    this.recoveryErrorMessage = '';
    this.recoverySuccessMessage = '';
    this.showRecoveryPassword = false;
    this.showRecoveryConfirmPassword = false;
  }

  closeRecoveryModal(): void {
    this.showRecoveryModal = false;
    this.recoveryStep = 1;
    this.recoveryErrorMessage = '';
    this.recoverySuccessMessage = '';
  }

  toggleRecoveryPassword(): void {
    this.showRecoveryPassword = !this.showRecoveryPassword;
  }

  toggleRecoveryConfirmPassword(): void {
    this.showRecoveryConfirmPassword = !this.showRecoveryConfirmPassword;
  }

  goToStep1(): void {
    this.recoveryStep = 1;
    this.recoveryErrorMessage = '';
    this.recoverySuccessMessage = '';
  }

  sendRecoveryCode(): void {
    const email = (this.recoveryEmail || '').trim();
    if (!email) {
      this.recoveryErrorMessage = 'Por favor, ingresa tu correo electrónico registrado.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.recoveryErrorMessage = 'Por favor, ingresa un formato de correo electrónico válido.';
      return;
    }

    this.isSendingRecoveryCode = true;
    this.recoveryErrorMessage = '';
    this.recoverySuccessMessage = '';

    this.authService.sendVerificationCode(email).subscribe({
      next: () => {
        this.isSendingRecoveryCode = false;
        this.recoveryStep = 2;
        this.recoveryErrorMessage = '';
        this.recoverySuccessMessage = `Hemos enviado un código de 6 dígitos a ${email}.`;
      },
      error: (err: any) => {
        this.isSendingRecoveryCode = false;
        console.error('Error al enviar código de recuperación:', err);
        if (err.status === 404) {
          this.recoveryErrorMessage = 'No se encontró ninguna cuenta registrada con este correo electrónico.';
        } else if (err.error && typeof err.error === 'string') {
          this.recoveryErrorMessage = err.error;
        } else {
          this.recoveryErrorMessage = 'Error al enviar el código de verificación. Por favor intenta nuevamente.';
        }
      }
    });
  }

  submitResetPassword(): void {
    this.recoveryErrorMessage = '';
    this.recoverySuccessMessage = '';

    const code = (this.recoveryCode || '').trim();
    const newPassword = this.recoveryNewPassword;
    const confirmPassword = this.recoveryConfirmPassword;

    if (!code || code.length !== 6) {
      this.recoveryErrorMessage = 'El código de verificación debe contener exactamente 6 dígitos.';
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      this.recoveryErrorMessage = 'La nueva contraseña debe tener como mínimo 6 caracteres.';
      return;
    }

    if (newPassword !== confirmPassword) {
      this.recoveryErrorMessage = 'Las contraseñas no coinciden. Por favor verifícalas.';
      return;
    }

    this.isResettingPassword = true;

    this.authService.verifyPasswordChange(this.recoveryEmail.trim(), code, newPassword).subscribe({
      next: () => {
        this.isResettingPassword = false;
        this.recoveryStep = 3;
        this.recoverySuccessMessage = '¡Contraseña actualizada con éxito!';
        // Rellenar automáticamente el formulario de login con el correo
        this.loginForm.patchValue({
          username: this.recoveryEmail.trim(),
          password: ''
        });
      },
      error: (err: any) => {
        this.isResettingPassword = false;
        console.error('Error al restablecer contraseña:', err);
        if (err.status === 400 || err.status === 404) {
          this.recoveryErrorMessage = err.error?.message || (typeof err.error === 'string' ? err.error : 'El código es incorrecto o ya ha expirado.');
        } else {
          this.recoveryErrorMessage = 'No se pudo cambiar la contraseña. Verifica el código e intenta nuevamente.';
        }
      }
    });
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
        if (response.loginCount === 1) {
          this.router.navigate(['/profile'], { queryParams: { forceChange: 'true' } });
        } else {
          this.router.navigate(['/dashboard']);
        }
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
