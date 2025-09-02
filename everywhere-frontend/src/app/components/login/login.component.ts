import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true, // 🚀 importante en standalone
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [
    CommonModule,        // para directivas como *ngIf, *ngFor
    ReactiveFormsModule  // para formGroup y formControlName
  ]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Por favor complete todos los campos';
      return;
    }

    this.isLoading = true;
    const { username, password } = this.loginForm.value;

    setTimeout(() => {
      if (username === 'admin' && password === 'adminadmin') {
        console.log('✅ Login exitoso');
      } else {
        this.errorMessage = 'Usuario o contraseña incorrectos';
      }
      this.isLoading = false;
    }, 1000);
  }
}
