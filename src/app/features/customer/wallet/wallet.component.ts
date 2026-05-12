import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WalletService } from '../../../core/services/wallet.service';
import { AuthService } from '../../../core/services/auth.service';
import { EWallet, Statement } from '../../../core/models/wallet.models';

declare var Razorpay: any;

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatTableModule],
  templateUrl: './wallet.component.html',
  styleUrl: './wallet.component.css'
})
export class WalletComponent implements OnInit {
  wallet: EWallet | null = null;
  loading = true;
  topUpForm: FormGroup;
  displayedColumns: string[] = ['date', 'transactionType', 'amount', 'remarks'];

  private walletService = inject(WalletService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.topUpForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadWallet();
  }

  loadWallet() {
    const userId = this.authService.getUserId();
    if (userId) {
      this.walletService.getWalletById(userId).subscribe({
        next: (data) => {
          this.wallet = data;
          this.wallet.statements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          this.loading = false;
        },
        error: (err) => {
          if (err.status === 404) {
            // Wallet not found, create one
            this.walletService.createWallet(userId).subscribe({
              next: (data) => {
                this.wallet = data;
                this.loading = false;
              },
              error: () => {
                this.loading = false;
              }
            });
          } else {
            this.loading = false;
          }
        }
      });
    }
  }

  onTopUp() {
    if (this.topUpForm.invalid) return;

    this.loading = true;
    const amount = this.topUpForm.value.amount;

    this.walletService.initiateTopUp(amount).subscribe({
      next: (orderInfo) => {
        this.loading = false;
        this.openRazorpay(orderInfo, amount);
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to initiate top-up', 'Close', { duration: 3000 });
      }
    });
  }

  private openRazorpay(orderInfo: any, amount: number) {
    const options = {
      key: orderInfo.keyId,
      amount: orderInfo.amount,           // amount in paise (from backend)
      currency: orderInfo.currency || 'INR',
      name: "EShoppingZone Wallet",
      description: "Wallet Top-up",
      order_id: orderInfo.razorpayOrderId, // ✅ correct field from backend
      handler: (response: any) => {
        this.loading = true;
        const verificationData = {
          razorpayOrderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          amount: amount
        };

        this.walletService.verifyAndAdd(verificationData).subscribe({
          next: () => {
            this.snackBar.open('Wallet topped up successfully!', 'Close', { duration: 3000 });
            this.topUpForm.reset();
            this.loadWallet();
          },
          error: () => {
            this.loading = false;
            this.snackBar.open('Top-up verification failed', 'Close', { duration: 3000 });
          }
        });
      },
      theme: {
        color: "#f43f5e"
      }
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function (response: any){
        alert(response.error.description);
    });
    rzp.open();
  }
}
