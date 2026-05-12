import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  const expectedRoles: string[] = route.data['roles'];
  const currentRole = authService.getRole();

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  if (currentRole && expectedRoles.includes(currentRole)) {
    return true;
  }

  snackBar.open('You do not have permission to access this page.', 'Close', { duration: 3000 });
  router.navigate(['/']);
  return false;
};
