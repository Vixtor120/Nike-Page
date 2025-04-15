import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, LoginResponse } from '../../services/auth.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required])
    });
  }

  ngOnInit(): void {
    // Mostrar mensaje si viene redirigido del registro
    this.route.queryParams.subscribe(params => {
      if (params['registered'] === 'success') {
        this.successMessage = 'Registro exitoso. Ahora puedes iniciar sesión.';
      }
    });
  }

  // Método para verificar si un campo tiene errores
  hasError(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  // Método para obtener el mensaje de error de un campo
  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    
    if (!control) return '';
    
    if (control.errors?.['required']) {
      return 'Este campo es obligatorio';
    }
    
    if (field === 'email' && control.errors?.['email']) {
      return 'El formato de email no es válido';
    }
    
    return 'Campo inválido';
  }

  onSubmit() {
    // Limpiar mensajes previos
    this.errorMessage = '';
    this.successMessage = '';

    if (this.loginForm.invalid) {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    
    // Llamada al servicio de autenticación
    this.authService.login(this.loginForm.value).subscribe({
      next: (response: LoginResponse) => {
        this.loading = false;
        console.log('Usuario autenticado:', response);
        
        // Redireccionar según el rol
        if (response.user.rol === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error de login:', error);
        this.errorMessage = error.error?.error || 'Error al iniciar sesión. Verifica tus credenciales.';
      }
    });
  }
}
