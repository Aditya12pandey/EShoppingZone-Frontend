import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../core/services/product.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product, AddProductDto } from '../../../core/models/product.models';
import { Order } from '../../../core/models/order.models';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-merchant-dashboard',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTabsModule, MatCardModule, 
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatTableModule,
    MatSelectModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  products: Product[] = [];
  productForm: FormGroup;
  isEditing = false;
  currentProductId: string | null = null;
  loading = false;
  displayedColumns: string[] = ['image', 'name', 'price', 'category', 'actions'];
  
  merchantOrders: Order[] = [];
  orderDisplayedColumns: string[] = ['orderId', 'product', 'customer', 'amount', 'date', 'status', 'actions'];
  availableStatuses: string[] = ['Placed', 'Shipped', 'Delivered', 'Cancelled'];

  private productService = inject(ProductService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.productForm = this.fb.group({
      productType: ['', Validators.required],
      productName: ['', Validators.required],
      category: ['', Validators.required],
      imageUrls: this.fb.array([this.fb.control('', Validators.required)]),
      price: ['', [Validators.required, Validators.min(0)]],
      description: ['', Validators.required]
    });
  }

  get imageUrls() {
    return this.productForm.get('imageUrls') as FormArray;
  }

  addImage() {
    this.imageUrls.push(this.fb.control('', Validators.required));
  }

  removeImage(index: number) {
    if (this.imageUrls.length > 1) {
      this.imageUrls.removeAt(index);
    }
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadMerchantOrders();
  }

  loadMerchantOrders() {
    const merchantId = this.authService.getUserId();
    if (merchantId) {
      this.orderService.getOrdersByMerchantId(merchantId).subscribe({
        next: (data) => {
          this.merchantOrders = data;
        },
        error: (err) => console.error('Error loading merchant orders:', err)
      });
    }
  }

  updateOrderStatus(orderId: number, status: string) {
    this.orderService.changeOrderStatus({ orderId, status }).subscribe({
      next: () => {
        this.snackBar.open(`Order #${orderId} status updated to ${status}`, 'Close', { duration: 3000 });
        this.loadMerchantOrders();
      },
      error: (err) => {
        this.snackBar.open('Failed to update status', 'Close', { duration: 3000 });
        console.error(err);
      }
    });
  }

  loadProducts() {
    const merchantId = this.authService.getUserId();
    if (merchantId) {
      this.productService.getAllProducts().subscribe({
        next: (data) => {
          // Filter products for this merchant
          this.products = data.filter(p => String(p.merchantId) === String(merchantId));
        }
      });
    }
  }

  onSubmit() {
    if (this.productForm.invalid) return;

    this.loading = true;
    const formValue = this.productForm.value;
    
    const productData: AddProductDto = {
      productType: formValue.productType,
      productName: formValue.productName,
      category: formValue.category,
      image: formValue.imageUrls.filter((url: string) => url.trim() !== ''),
      price: formValue.price,
      description: formValue.description,
      specification: { "Key Features": formValue.description.substring(0, 50) } // Object instead of string
    };

    if (this.isEditing && this.currentProductId) {
      this.productService.updateProduct(this.currentProductId, productData).subscribe({
        next: () => {
          this.snackBar.open('Product updated successfully', 'Close', { duration: 3000 });
          this.resetForm();
          this.loadProducts();
        },
        error: (err) => {
          this.loading = false;
          const msg = err.error?.message || 'Failed to update product';
          this.snackBar.open(msg, 'Close', { duration: 5000 });
        }
      });
    } else {
      this.productService.addProduct(productData).subscribe({
        next: () => {
          this.snackBar.open('Product added successfully', 'Close', { duration: 3000 });
          this.resetForm();
          this.loadProducts();
        },
        error: (err) => {
          this.loading = false;
          const msg = err.error?.message || 'Failed to add product';
          this.snackBar.open(msg, 'Close', { duration: 5000 });
        }
      });
    }
  }

  editProduct(product: Product) {
    this.isEditing = true;
    this.currentProductId = product.productId;
    
    // Clear and refill image FormArray
    this.imageUrls.clear();
    if (product.image && product.image.length > 0) {
      product.image.forEach(url => this.imageUrls.push(this.fb.control(url, Validators.required)));
    } else {
      this.addImage();
    }

    this.productForm.patchValue({
      productType: product.productType,
      productName: product.productName,
      category: product.category,
      price: product.price,
      description: product.description
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteProduct(productId: string) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(productId).subscribe({
        next: () => {
          this.snackBar.open('Product deleted', 'Close', { duration: 3000 });
          this.loadProducts();
        }
      });
    }
  }

  resetForm() {
    this.isEditing = false;
    this.currentProductId = null;
    this.productForm.reset();
    this.imageUrls.clear();
    this.addImage();
    this.loading = false;
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'https://placehold.co/100x100?text=Preview\nUnavailable';
    img.style.opacity = '0.5';
  }
}
