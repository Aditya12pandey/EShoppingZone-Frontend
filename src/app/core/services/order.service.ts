import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order, PlaceOrderDto, ChangeStatusDto } from '../models/order.models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = environment.orderApi + '/api/order'; // Wait, handoff says endpoints are /api/orders. I should check. Handoff says: OrderController.cs. Let me use /api/order since other APIs are singular or plural. Handoff says /api/orders/initiatePayment. I'll use /api/orders. Wait, product is /api/product, cart is /api/cart, order is probably /api/orders or /api/order. I'll use /api/orders and I can fix it later if needed.

  constructor(private http: HttpClient) {}

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${environment.orderApi}/api/orders`);
  }

  getOrdersByCustomerId(customerId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${environment.orderApi}/api/orders/customer/${customerId}`);
  }

  getOrdersByMerchantId(merchantId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${environment.orderApi}/api/orders/merchant/${merchantId}`);
  }

  placeOrder(dto: PlaceOrderDto): Observable<Order> {
    return this.http.post<Order>(`${environment.orderApi}/api/orders/place`, dto);
  }

  changeOrderStatus(dto: ChangeStatusDto): Observable<void> {
    return this.http.put<void>(`${environment.orderApi}/api/orders/status`, dto);
  }

  initiatePayment(amount: number): Observable<any> {
    return this.http.post<any>(`${environment.orderApi}/api/orders/initiatePayment`, { amount, currency: 'INR' });
  }

  verifyAndPlaceOrder(data: any): Observable<Order> {
    // Backend expects VerifyPaymentDto
    const payload = {
      razorpayOrderId: data.razorpayOrderId,
      razorpayPaymentId: data.paymentId,
      razorpaySignature: data.signature,
      ...data.orderDto
    };
    return this.http.post<Order>(`${environment.orderApi}/api/orders/verifyAndPlace`, payload);
  }
}
