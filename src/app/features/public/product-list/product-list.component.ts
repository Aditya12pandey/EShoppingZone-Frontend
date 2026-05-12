import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  loading = true;

  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.productService.getAllProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load products', 'Close', { duration: 3000 });
      }
    });
  }

  addToCart(product: Product): void {
    if (!this.authService.isLoggedIn() || this.authService.getRole() !== 'CUSTOMER') {
      this.snackBar.open('Please login as a Customer to add items to cart', 'Close', { duration: 3000 });
      return;
    }

    const dto = {
      productId: product.productId,
      productName: product.productName,
      price: product.price,
      quantity: 1,
      merchantId: Number(product.merchantId)
    };

    this.cartService.addToCart(dto).subscribe({
      next: () => {
        this.snackBar.open(`${product.productName} added to cart`, 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to add to cart', 'Close', { duration: 3000 });
      }
    });
  }
}
