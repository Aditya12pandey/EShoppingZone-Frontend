import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.models';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatDividerModule, MatTooltipModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  loading = true;
  selectedQty = 1;

  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productService.getProductById(id).subscribe({
        next: (data) => {
          this.product = data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Product not found', 'Close', { duration: 3000 });
        }
      });
    }
  }

  increaseQty(): void { this.selectedQty++; }
  decreaseQty(): void { if (this.selectedQty > 1) this.selectedQty--; }

  getSpecs(): { key: string, value: string }[] {
    if (!this.product?.specification) return [];
    try {
      const specs = this.product.specification;
      return Object.keys(specs).map(key => ({ key, value: specs[key] }));
    } catch {
      return [];
    }
  }

  addToCart(): void {
    if (!this.product) return;
    if (!this.authService.isLoggedIn() || this.authService.getRole() !== 'CUSTOMER') {
      this.snackBar.open('Please login as a Customer to add items to cart', 'Close', { duration: 3000 });
      return;
    }

    const dto = {
      productId: this.product.productId,
      productName: this.product.productName,
      price: this.product.price,
      quantity: this.selectedQty,
      merchantId: Number(this.product.merchantId)
    };

    this.cartService.addToCart(dto).subscribe({
      next: () => {
        this.snackBar.open(`${this.product?.productName} ×${this.selectedQty} added to cart ✓`, 'Close', { duration: 2500 });
      },
      error: () => {
        this.snackBar.open('Failed to add to cart', 'Close', { duration: 3000 });
      }
    });
  }
}
