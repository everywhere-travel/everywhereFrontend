import { CanActivateFn, Router } from '@angular/router';
import { AuthServiceService } from '../../service/auth/auth.service';
import { inject } from '@angular/core';

export const authInverseGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthServiceService);
    const router = inject(Router);

    // Si está autenticado, redirigir al dashboard (sin importar el rol)
    if (authService.isAuthenticated()) {
        router.navigate(['/dashboard']);
        return false;
    }
    return true;
};
