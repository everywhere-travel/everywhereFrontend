import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthServiceService } from '../../service/auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthServiceService);
    const router = inject(Router);
    
    if (authService.isAuthenticated()) {
        const user = authService.getUser();
        // Si es cuenta nueva (loginCount === 0) y trata de ir a cualquier lado que NO sea profile
        if (user && user.loginCount === 0 && !state.url.startsWith('/profile')) {
            router.navigate(['/profile']);
            return false;
        }
        return true;
    } else {
        router.navigate(['/auth/login']);
        return false;
    }
};
