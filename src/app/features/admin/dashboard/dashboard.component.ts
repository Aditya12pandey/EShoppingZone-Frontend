import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/order.models';
import { ProfileService } from '../../../core/services/profile.service';
import { UserProfile } from '../../../core/models/auth.models';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatSelectModule, MatFormFieldModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  orders: Order[] = [];
  users: UserProfile[] = [];
  usersLoading = false;
  ordersLoading = false;
  displayedColumns: string[] = ['orderId', 'customerId', 'date', 'amount', 'status', 'actions'];
  userColumns: string[] = ['profileId', 'fullName', 'emailId', 'role', 'actions'];

  orderStatuses = ['PLACED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  private orderService = inject(OrderService);
  private profileService = inject(ProfileService);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.loadOrders();
    this.loadUsers();
  }

  loadOrders() {
    this.ordersLoading = true;
    this.orderService.getAllOrders().subscribe({
      next: (data) => {
        this.orders = data || [];
        this.ordersLoading = false;
      },
      error: () => {
        this.ordersLoading = false;
        this.snackBar.open('Failed to load orders', 'Close', { duration: 3000 });
      }
    });
  }

  loadUsers() {
    this.usersLoading = true;
    this.profileService.getAllUsers().subscribe({
      next: (data) => {
        this.users = (data || []).map((u: any) => ({
          ...u,
          profileId: u.profileId ?? u.ProfileId,
          fullName: u.fullName ?? u.FullName,
          emailId: u.emailId ?? u.EmailId,
          role: u.role ?? u.Role
        }));
        this.usersLoading = false;
      },
      error: () => {
        this.usersLoading = false;
        this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
      }
    });
  }

  trackByProfileId(index: number, user: UserProfile): number {
    return user?.profileId;
  }

  trackByOrderId(index: number, order: Order): number {
    return order?.orderId;
  }

  deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.profileService.deleteUser(id).subscribe({
        next: () => {
          this.snackBar.open('User deleted successfully', 'Close', { duration: 3000 });
          this.loadUsers();
        },
        error: () => {
          this.snackBar.open('Failed to delete user', 'Close', { duration: 3000 });
        }
      });
    }
  }

  changeOrderStatus(orderId: number, event: any) {
    const newStatus = event.value;
    this.orderService.changeOrderStatus({ orderId, status: newStatus }).subscribe({
      next: () => {
        this.snackBar.open('Order status updated successfully', 'Close', { duration: 3000 });
        const order = this.orders.find(o => o.orderId === orderId);
        if (order) order.orderStatus = newStatus;
      },
      error: () => {
        this.snackBar.open('Failed to update status', 'Close', { duration: 3000 });
      }
    });
  }
}
