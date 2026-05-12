import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Cart, AddToCartDto } from '../models/cart.models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = environment.cartApi + '/api/carts';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getCart(): Observable<Cart> {
    const userId = this.authService.getUserId();
    if (!userId) {
      // Return empty observable or handle guest state
      return new Observable<Cart>();
    }
    return this.http.get<Cart>(`${this.apiUrl}/${userId}`);
  }

  createCart(): Observable<Cart> {
    return this.http.post<Cart>(`${this.apiUrl}/create`, {});
  }

  addToCart(dto: AddToCartDto): Observable<Cart> {
    return this.http.post<Cart>(`${this.apiUrl}/addItem`, dto).pipe(
      catchError(error => {
        if (error.status === 404) {
          // Cart not found, create it and retry adding item
          return this.createCart().pipe(
            switchMap(() => this.http.post<Cart>(`${this.apiUrl}/addItem`, dto))
          );
        }
        return throwError(() => error);
      })
    );
  }

  updateCart(cart: Cart): Observable<Cart> {
    return this.http.put<Cart>(this.apiUrl, cart);
  }

  deleteCart(): Observable<void> {
    const userId = this.authService.getUserId();
    return this.http.delete<void>(`${this.apiUrl}/${userId}`);
  }

  clearCart(): Observable<Cart> {
    return this.http.delete<Cart>(`${this.apiUrl}/clear`);
  }
}
