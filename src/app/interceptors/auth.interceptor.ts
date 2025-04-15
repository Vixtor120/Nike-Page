import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const AuthInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>, 
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Inject the auth service
  const authService = inject(AuthService);
  
  // Get the auth token
  const token = authService.getToken();

  // Clone the request and add the authorization header if token exists
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
