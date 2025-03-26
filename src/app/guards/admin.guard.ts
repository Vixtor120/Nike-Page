import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard {
  
  constructor(private router: Router) {}
  
  canActivate(): boolean {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      if (payload.rol === 'admin') {
        return true;
      }
      
      this.router.navigate(['/']);
      return false;
    } catch (error) {
      localStorage.removeItem('token');
      this.router.navigate(['/login']);
      return false;
    }
  }
}
