import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models/product.models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatTooltipModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  loading = true;
  searchText = '';
  selectedCategory = '';

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

  get categories(): string[] {
    const cats = [...new Set(this.products.map(p => p.category).filter(Boolean))];
    return cats;
  }

  get filteredProducts(): Product[] {
    return this.products.filter(p => {
      const matchSearch = !this.searchText ||
        p.productName.toLowerCase().includes(this.searchText.toLowerCase()) ||
        p.category?.toLowerCase().includes(this.searchText.toLowerCase());
      const matchCategory = !this.selectedCategory || p.category === this.selectedCategory;
      return matchSearch && matchCategory;
    });
  }

  selectCategory(cat: string): void {
    this.selectedCategory = this.selectedCategory === cat ? '' : cat;
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
        this.snackBar.open(`${product.productName} added to cart ✓`, 'Close', { duration: 2500 });
      },
      error: () => {
        this.snackBar.open('Failed to add to cart', 'Close', { duration: 3000 });
      }
    });
  }
}
