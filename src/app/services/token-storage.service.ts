import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  saveToken(token: string): void {
    if (this.isBrowser) {
      window.localStorage.setItem('token', token);
    }
  }

  getToken(): string | null {
    if (this.isBrowser) {
      return window.localStorage.getItem('token');
    }
    return null;
  }

  removeToken(): void {
    if (this.isBrowser) {
      window.localStorage.removeItem('token');
    }
  }

  saveUser(user: any): void {
    if (this.isBrowser) {
      window.localStorage.setItem('currentUser', JSON.stringify(user));
    }
  }

  getUser(): any {
    if (this.isBrowser) {
      const user = window.localStorage.getItem('currentUser');
      if (user) {
        try {
          return JSON.parse(user);
        } catch (e) {
          this.removeUser();
          return null;
        }
      }
    }
    return null;
  }

  removeUser(): void {
    if (this.isBrowser) {
      window.localStorage.removeItem('currentUser');
    }
  }

  clear(): void {
    if (this.isBrowser) {
      window.localStorage.clear();
    }
  }
}
