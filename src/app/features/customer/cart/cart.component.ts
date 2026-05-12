import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { CartService } from '../../../core/services/cart.service';
import { Cart } from '../../../core/models/cart.models';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatListModule, MatDividerModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  loading = true;

  private cartService = inject(CartService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart() {
    this.loading = true;
    this.cartService.getCart().subscribe({
      next: (data) => {
        this.cart = data;
        this.loading = false;
      },
      error: (err) => {
        if (err.status === 404) {
          // Cart not found, auto-create it
          this.cartService.createCart().subscribe({
            next: (newCart) => {
              this.cart = newCart;
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

  updateQuantity(productId: string, quantity: number, currentQuantity: number) {
    const newQuantity = currentQuantity + quantity;
    if (newQuantity < 1) {
      // In a real app, this might remove the item. For now, let's keep it simple or call a remove endpoint
      // Handoff doesn't specify a remove endpoint, only updateCart. 
      // Let's modify the cart items and call updateCart.
      if (!this.cart) return;
      this.cart.items = this.cart.items.filter(item => String(item.productId) !== String(productId));
      this.cartService.updateCart(this.cart).subscribe({
        next: (data) => { this.cart = data; },
        error: () => { this.snackBar.open('Failed to update cart', 'Close', { duration: 3000 }); }
      });
      return;
    }

    if (!this.cart) return;
    const itemIndex = this.cart.items.findIndex(i => String(i.productId) === String(productId));
    if (itemIndex > -1) {
      this.cart.items[itemIndex].quantity = newQuantity;
      this.cartService.updateCart(this.cart).subscribe({
        next: (data) => { this.cart = data; },
        error: () => { this.snackBar.open('Failed to update cart', 'Close', { duration: 3000 }); }
      });
    }
  }

  clearCart() {
    this.cartService.clearCart().subscribe({
      next: (data) => {
        this.cart = data;
        this.snackBar.open('Cart cleared', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to clear cart', 'Close', { duration: 3000 });
      }
    });
  }

  proceedToCheckout() {
    this.router.navigate(['/checkout']);
  }
}
