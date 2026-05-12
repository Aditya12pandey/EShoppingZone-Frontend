import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserProfile } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = environment.profileApi + '/api/profiles';

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${this.apiUrl}/all`);
  }

  getUserById(id: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/${id}`);
  }

  updateProfile(id: string, data: any): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/${id}`, data);
  }

  deleteUser(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
