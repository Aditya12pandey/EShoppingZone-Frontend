import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EWallet, AddMoneyDto, Statement } from '../models/wallet.models';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private apiUrl = environment.walletApi + '/api/wallet';

  constructor(private http: HttpClient) {}

  getWalletById(id: string): Observable<EWallet> {
    return this.http.get<EWallet>(`${this.apiUrl}/${id}`);
  }

  createWallet(id: string): Observable<EWallet> {
    return this.http.post<EWallet>(`${this.apiUrl}/new`, {});
  }

  addMoney(dto: AddMoneyDto): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/addMoney`, dto);
  }

  getStatements(id: string): Observable<Statement[]> {
    return this.http.get<Statement[]>(`${this.apiUrl}/statements/${id}`);
  }

  initiateTopUp(amount: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/initiateTopUp`, { amount, currency: 'INR' });
  }

  verifyAndAdd(data: any): Observable<string> {
    // Backend expects: razorpayOrderId, razorpayPaymentId, razorpaySignature, amount
    const payload = {
      razorpayOrderId: data.razorpayOrderId,
      razorpayPaymentId: data.paymentId,
      razorpaySignature: data.signature,
      amount: data.amount
    };
    return this.http.post<string>(`${this.apiUrl}/verifyAndAdd`, payload);
  }
}
