import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

interface UserProfile {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit {
  user: UserProfile | null = null;
  loading = true;
  error = '';
  successMessage = '';
  
  // Form models
  profileForm = {
    nombre: '',
    email: ''
  };
  
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.get<UserProfile>(`${this.apiUrl}/usuarios/perfil`, { headers })
      .subscribe({
        next: (data) => {
          this.user = data;
          this.profileForm.nombre = data.nombre;
          this.profileForm.email = data.email;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading profile:', err);
          this.error = 'No se pudo cargar el perfil. Por favor, inténtelo de nuevo más tarde.';
          this.loading = false;
          
          // If unauthorized, redirect to login
          if (err.status === 401) {
            localStorage.removeItem('token');
            this.router.navigate(['/login']);
          }
        }
      });
  }

  updateProfile(): void {
    if (!this.validateProfileForm()) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.loading = true;
    this.http.put(`${this.apiUrl}/usuarios/perfil`, this.profileForm, { headers })
      .subscribe({
        next: () => {
          this.successMessage = 'Perfil actualizado correctamente';
          this.loading = false;
          
          // Update the local user object
          if (this.user) {
            this.user.nombre = this.profileForm.nombre;
            this.user.email = this.profileForm.email;
          }
          
          // Clear message after delay
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          console.error('Error updating profile:', err);
          this.error = 'Error al actualizar el perfil. Por favor, inténtelo de nuevo.';
          this.loading = false;
          
          // Clear error after delay
          setTimeout(() => this.error = '', 3000);
        }
      });
  }

  updatePassword(): void {
    if (!this.validatePasswordForm()) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const payload = {
      currentPassword: this.passwordForm.currentPassword,
      newPassword: this.passwordForm.newPassword
    };
    
    this.loading = true;
    this.http.put(`${this.apiUrl}/usuarios/password`, payload, { headers })
      .subscribe({
        next: () => {
          this.successMessage = 'Contraseña actualizada correctamente';
          this.loading = false;
          this.resetPasswordForm();
          
          // Clear message after delay
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          console.error('Error updating password:', err);
          this.error = err.error?.error === 'Current password incorrect' 
            ? 'La contraseña actual es incorrecta' 
            : 'Error al actualizar la contraseña. Por favor, inténtelo de nuevo.';
          this.loading = false;
          
          // Clear error after delay
          setTimeout(() => this.error = '', 3000);
        }
      });
  }

  private validateProfileForm(): boolean {
    if (!this.profileForm.nombre || !this.profileForm.email) {
      this.error = 'El nombre y el correo electrónico son obligatorios';
      setTimeout(() => this.error = '', 3000);
      return false;
    }
    
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailPattern.test(this.profileForm.email)) {
      this.error = 'Por favor, introduce un correo electrónico válido';
      setTimeout(() => this.error = '', 3000);
      return false;
    }
    
    return true;
  }

  private validatePasswordForm(): boolean {
    if (!this.passwordForm.currentPassword || !this.passwordForm.newPassword || !this.passwordForm.confirmPassword) {
      this.error = 'Todos los campos de contraseña son obligatorios';
      setTimeout(() => this.error = '', 3000);
      return false;
    }
    
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.error = 'Las contraseñas nuevas no coinciden';
      setTimeout(() => this.error = '', 3000);
      return false;
    }
    
    if (this.passwordForm.newPassword.length < 6) {
      this.error = 'La contraseña nueva debe tener al menos 6 caracteres';
      setTimeout(() => this.error = '', 3000);
      return false;
    }
    
    return true;
  }

  private resetPasswordForm(): void {
    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }
}
