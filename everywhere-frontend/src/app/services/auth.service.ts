import { Injectable } from "@angular/core"
import { BehaviorSubject, Observable } from "rxjs"
import type { Router } from "@angular/router"

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false)
  private currentUserSubject = new BehaviorSubject<any>(null)

  constructor(private router: Router) {
    const token = localStorage.getItem("auth_token")
    const user = localStorage.getItem("current_user")
    if (token && user) {
      this.isAuthenticatedSubject.next(true)
      this.currentUserSubject.next(JSON.parse(user))
    }
  }

  get isAuthenticated$(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable()
  }

  get currentUser$(): Observable<any> {
    return this.currentUserSubject.asObservable()
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value
  }

  login(username: string, password: string): Observable<boolean> {
    return new Observable((observer) => {
      if (username === "admin" && password === "adminadmin") {
        const user = {
          id: 1,
          username: "admin",
          name: "Administrador",
          role: "admin",
        }

        const token = "admin_token_" + Date.now()

        localStorage.setItem("auth_token", token)
        localStorage.setItem("current_user", JSON.stringify(user))

        this.isAuthenticatedSubject.next(true)
        this.currentUserSubject.next(user)

        observer.next(true)
        observer.complete()
      } else {
        observer.next(false)
        observer.complete()
      }
    })
  }

  logout(): void {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("current_user")
    this.isAuthenticatedSubject.next(false)
    this.currentUserSubject.next(null)
    this.router.navigate(["/login"])
  }

  getToken(): string | null {
    return localStorage.getItem("auth_token")
  }
}
