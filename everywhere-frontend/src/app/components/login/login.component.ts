import { Component } from "@angular/core"
import { CommonModule } from "@angular/common"
import { type FormBuilder, type FormGroup, Validators, ReactiveFormsModule } from "@angular/forms"
import type { Router } from "@angular/router"
import type { AuthService } from "../../services/auth.service"

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
})
export class LoginComponent {
  loginForm: FormGroup
  isLoading = false
  errorMessage = ""

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      username: ["", [Validators.required]],
      password: ["", [Validators.required]],
    })
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true
      this.errorMessage = ""

      const { username, password } = this.loginForm.value

      this.authService.login(username, password).subscribe({
        next: (success) => {
          this.isLoading = false
          if (success) {
            this.router.navigate(["/dashboard"])
          } else {
            this.errorMessage = "Credenciales incorrectas. Use admin/adminadmin"
          }
        },
        error: (error) => {
          this.isLoading = false
          this.errorMessage = "Error al iniciar sesión"
        },
      })
    }
  }
}
