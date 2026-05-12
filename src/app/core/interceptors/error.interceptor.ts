import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Let service-level handlers deal with 404s silently (e.g. cart/wallet auto-create)
      if (error.status === 404) {
        return throwError(() => error);
      }

      let errorMessage = 'An unknown error occurred!';

      if (error.error) {
        if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error.message) {
          errorMessage = error.error.message;
        } else if (error.error.errors) {
          const validationErrors = Object.values(error.error.errors).flat().join(' ');
          errorMessage = validationErrors || 'Validation failed.';
        }
      }

      // Don't show snackbar for 401 (redirect handles it)
      if (error.status !== 401) {
        snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }

      if (error.status === 401) {
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
