import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { LoginResponseDto } from '../models/auth.models';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.profileApi + '/api/profiles';
  
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadToken();
  }

  private loadToken() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        this.currentUserSubject.next(decoded);
      } catch (e) {
        this.logout();
      }
    }
  }

  login(credentials: any): Observable<LoginResponseDto> {
    return this.http.post<LoginResponseDto>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          const decoded = jwtDecode(response.token);
          this.currentUserSubject.next(decoded);
        }
      })
    );
  }

  registerCustomer(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register/customer`, data);
  }

  registerMerchant(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register/merchant`, data);
  }

  logout() {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getRole(): string | null {
    const user = this.currentUserSubject.value;
    return user ? user['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || user.role : null;
  }

  getUserId(): string | null {
    const user = this.currentUserSubject.value;
    return user ? user.userId : null;
  }
}
