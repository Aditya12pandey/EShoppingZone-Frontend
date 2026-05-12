import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { Cart } from '../../../core/models/cart.models';
import { PlaceOrderDto } from '../../../core/models/order.models';
import { MatSnackBar } from '@angular/material/snack-bar';

declare var Razorpay: any;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatRadioModule, MatStepperModule, MatIconModule, MatDividerModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  addressForm: FormGroup;
  paymentForm: FormGroup;
  cart: Cart | null = null;
  loading = false;

  private fb = inject(FormBuilder);
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.addressForm = this.fb.group({
      fullName: ['', Validators.required],
      mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      flatNumber: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    this.paymentForm = this.fb.group({
      modeOfPayment: ['COD', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cartService.getCart().subscribe({
      next: (data) => {
        this.cart = data;
        if (!this.cart || !this.cart.items || this.cart.items.length === 0) {
          this.router.navigate(['/cart']);
        }
      },
      error: () => {
        this.router.navigate(['/cart']);
      }
    });
  }

  placeOrder() {
    if (this.addressForm.invalid || this.paymentForm.invalid || !this.cart) return;

    this.loading = true;
    const paymentMode = this.paymentForm.value.modeOfPayment;

    if (paymentMode === 'ONLINE') {
      // Razorpay Flow
      this.orderService.initiatePayment(this.cart.totalPrice).subscribe({
        next: (orderInfo) => {
          this.loading = false;
          this.openRazorpay(orderInfo);
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Failed to initiate online payment', 'Close', { duration: 3000 });
        }
      });
    } else {
      // COD or EWALLET
      const dto: PlaceOrderDto = this.buildOrderDto(paymentMode);
      this.orderService.placeOrder(dto).subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open('Order placed successfully!', 'Close', { duration: 3000 });
          this.cartService.clearCart().subscribe({ error: () => {} }); // Clear cart
          this.router.navigate(['/my-orders']);
        },
        error: (err) => {
          this.loading = false;
          // Global error interceptor handles the message, we just stay on the page
        }
      });
    }
  }

  private openRazorpay(orderInfo: any) {
    const options = {
      key: orderInfo.keyId,
      amount: orderInfo.amount,
      currency: "INR",
      name: "EShoppingZone",
      description: "Order Payment",
      order_id: orderInfo.razorpayOrderId,
      handler: (response: any) => {
        // Payment Success
        this.loading = true;
        const verificationData = {
          razorpayOrderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          orderDto: this.buildOrderDto('ONLINE')
        };

        this.orderService.verifyAndPlaceOrder(verificationData).subscribe({
          next: () => {
            this.loading = false;
            this.snackBar.open('Payment verified and Order placed successfully!', 'Close', { duration: 3000 });
            this.cartService.clearCart().subscribe({ error: () => {} });
            this.router.navigate(['/my-orders']);
          },
          error: () => {
            this.loading = false;
            this.snackBar.open('Payment verification failed', 'Close', { duration: 3000 });
          }
        });
      },
      prefill: {
        name: this.addressForm.value.fullName,
        contact: this.addressForm.value.mobileNumber
      },
      theme: {
        color: "#6366f1"
      }
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function (response: any){
        alert(response.error.description);
    });
    rzp.open();
  }

  private buildOrderDto(paymentMode: string): PlaceOrderDto {
    const firstItem = this.cart!.items[0];
    return {
      customerId: this.authService.getUserId()!,
      merchantId: firstItem?.merchantId || 1,
      amountPaid: this.cart!.totalPrice,
      modeOfPayment: paymentMode,
      quantity: this.cart!.items.reduce((acc, item) => acc + item.quantity, 0),
      productName: this.cart!.items.map(i => i.productName).join(', '),
      productId: firstItem?.productId,
      address: this.addressForm.value
    };
  }
}
