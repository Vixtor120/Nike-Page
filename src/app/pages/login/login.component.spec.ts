import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../services/auth.service';
import { of, throwError } from 'rxjs';

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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should login successfully with valid credentials', () => {
    const mockResponse = { user: { rol: 'user' } };
    authService.login.and.returnValue(of(mockResponse));

    component.loginForm.setValue({ email: 'admin@test.com', password: 'password123' });
    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith({ email: 'admin@test.com', password: 'password123' });
  });

  it('should show an error message for invalid credentials', () => {
    authService.login.and.returnValue(throwError({ error: { error: 'Invalid credentials' } }));

    component.loginForm.setValue({ email: 'invalid@test.com', password: 'wrongpassword' });
    component.onSubmit();

    expect(component.errorMessage).toBe('Invalid credentials');
  });
});