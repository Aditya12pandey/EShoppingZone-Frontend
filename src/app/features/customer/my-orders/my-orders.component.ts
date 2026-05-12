import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { Order } from '../../../core/models/order.models';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatChipsModule, MatExpansionModule, MatIconModule, MatDividerModule],
  templateUrl: './my-orders.component.html',
  styleUrl: './my-orders.component.css'
})
export class MyOrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = true;

  private orderService = inject(OrderService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.orderService.getOrdersByCustomerId(userId).subscribe({
        next: (data) => {
          this.orders = data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    }
  }

  getStatusColor(status: string): string {
    switch (status.toUpperCase()) {
      case 'PLACED': return 'primary';
      case 'SHIPPED': return 'accent';
      case 'DELIVERED': return 'primary'; // Could use a custom success color class instead
      case 'CANCELLED': return 'warn';
      default: return 'primary';
    }
  }
}
