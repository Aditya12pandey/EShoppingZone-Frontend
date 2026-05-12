import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatTabsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  customerForm: FormGroup;
  merchantForm: FormGroup;
  hideCustomerPassword = true;
  hideMerchantPassword = true;
  loading = false;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.customerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]*$/)]],
      emailId: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/)]],
      mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]]
    });

    this.merchantForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]*$/)]],
      emailId: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/)]],
      mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]]
    });
  }

  onRegisterCustomer() {
    if (this.customerForm.invalid) return;

    this.loading = true;
    const formValue = this.customerForm.value;
    const payload = {
      fullName: formValue.fullName,
      emailId: formValue.emailId,
      password: formValue.password,
      mobileNumber: Number(formValue.mobileNumber),
      gender: 'Other',
      dateOfBirth: '1990-01-01T00:00:00Z'
    };

    this.authService.registerCustomer(payload).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Registration successful! Please login.', 'Close', { duration: 3000 });
        this.router.navigate(['/login']);
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Registration failed due to validation or conflict.', 'Close', { duration: 3000 });
      }
    });
  }

  onRegisterMerchant() {
    if (this.merchantForm.invalid) return;

    this.loading = true;
    const formValue = this.merchantForm.value;
    const payload = {
      fullName: formValue.fullName,
      emailId: formValue.emailId,
      password: formValue.password,
      mobileNumber: Number(formValue.mobileNumber),
      gender: 'Other',
      dateOfBirth: '1990-01-01T00:00:00Z'
    };

    this.authService.registerMerchant(payload).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Registration successful! Please login.', 'Close', { duration: 3000 });
        this.router.navigate(['/login']);
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Registration failed due to validation or conflict.', 'Close', { duration: 3000 });
      }
    });
  }
}
