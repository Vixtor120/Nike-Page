import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

// Define interfaces inline
export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'cliente';
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  userId: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Load user from localStorage if in browser
    if (this.isBrowser) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          this.currentUserSubject.next(JSON.parse(storedUser));
        } catch (e) {
          console.error('Error parsing stored user data:', e);
          localStorage.removeItem('currentUser');
        }
      }
    }
  }

  // Auth API methods
  register(userData: {nombre: string, email: string, password: string}): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, userData);
  }

  login(credentials: {email: string, password: string}): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (this.isBrowser) {
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            localStorage.setItem('token', response.token);
          }
          this.currentUserSubject.next(response.user);
        })
      );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
    }
    this.currentUserSubject.next(null);
  }

  // Token methods
  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem('token') : null;
  }

  // User state methods
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.rol === 'admin' || false;
  }
}
