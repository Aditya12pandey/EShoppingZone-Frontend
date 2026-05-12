import { Routes } from '@angular/router';
import { ProductListComponent } from './features/public/product-list/product-list.component';
import { ProductDetailComponent } from './features/public/product-detail/product-detail.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { CartComponent } from './features/customer/cart/cart.component';
import { CheckoutComponent } from './features/customer/checkout/checkout.component';
import { MyOrdersComponent } from './features/customer/my-orders/my-orders.component';
import { WalletComponent } from './features/customer/wallet/wallet.component';
import { DashboardComponent as MerchantDashboardComponent } from './features/merchant/dashboard/dashboard.component';
import { DashboardComponent as AdminDashboardComponent } from './features/admin/dashboard/dashboard.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', component: ProductListComponent },
  { path: 'product/:id', component: ProductDetailComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'cart', 
    component: CartComponent, 
    canActivate: [authGuard, roleGuard], 
    data: { roles: ['CUSTOMER'] } 
  },
  { 
    path: 'checkout', 
    component: CheckoutComponent, 
    canActivate: [authGuard, roleGuard], 
    data: { roles: ['CUSTOMER'] } 
  },
  { 
    path: 'my-orders', 
    component: MyOrdersComponent, 
    canActivate: [authGuard, roleGuard], 
    data: { roles: ['CUSTOMER'] } 
  },
  { 
    path: 'wallet', 
    component: WalletComponent, 
    canActivate: [authGuard, roleGuard], 
    data: { roles: ['CUSTOMER'] } 
  },
  { 
    path: 'merchant/dashboard', 
    component: MerchantDashboardComponent, 
    canActivate: [authGuard, roleGuard], 
    data: { roles: ['MERCHANT'] } 
  },
  { 
    path: 'admin/dashboard', 
    component: AdminDashboardComponent, 
    canActivate: [authGuard, roleGuard], 
    data: { roles: ['ADMIN'] } 
  },
];
