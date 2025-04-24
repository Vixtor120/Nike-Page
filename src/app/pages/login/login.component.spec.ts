import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../services/auth.service';
import { of, throwError } from 'rxjs';
import { LoginResponse } from '../../models/auth.model'; // Make sure to import this

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule, HttpClientTestingModule, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture.detectChanges();
  });

  it('debería crearse', () => {
    expect(component).toBeTruthy();
  });

  it('debería iniciar sesión correctamente con credenciales válidas', () => {
    // Explicitly type the mock response to match the LoginResponse interface
    const mockResponse: LoginResponse = {
      message: 'Login successful',
      token: 'mock-jwt-token',
      user: {
        rol: 'admin' as 'admin', // Type assertion to ensure it's the literal type
        id: 1,
        nombre: 'Test User',
        email: 'test@example.com'
      }
    };
    
    authService.login.and.returnValue(of(mockResponse));

    component.loginForm.setValue({ email: 'admin@test.com', password: 'password123' });
    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith({ email: 'admin@test.com', password: 'password123' });
  });

  it('debería mostrar un mensaje de error para credenciales inválidas', () => {
    authService.login.and.returnValue(throwError({ error: { error: 'Invalid credentials' } }));

    component.loginForm.setValue({ email: 'invalid@test.com', password: 'wrongpassword' });
    component.onSubmit();

    expect(component.errorMessage).toBe('Invalid credentials');
  });
});