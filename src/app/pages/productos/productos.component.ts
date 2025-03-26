import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  descripcion: string;
  tipo_producto: string;
  producto_oferta: boolean;
  imagen: string;
  stock: number;
}

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})
export class ProductosComponent implements OnInit {
  productos: Producto[] = [];
  isLoading = true;
  error: string | null = null;
  isAdmin = false;
  mensaje: string | null = null;
  
  private apiUrl = 'http://localhost:3000/productos';

  constructor(private http: HttpClient) {}
  
  ngOnInit() {
    this.cargarProductos();
    this.verificarAdmin();
  }
  
  private verificarAdmin() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const datos = this.decodificarToken(token);
      this.isAdmin = datos?.rol === 'admin';
    } catch (e) {
      this.isAdmin = false;
    }
  }
  
  private decodificarToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }
  
  private cargarProductos() {
    this.isLoading = true;
    
    this.http.get<Producto[]>(this.apiUrl).subscribe({
      next: (datos) => {
        this.productos = datos;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Error al cargar los productos';
        this.isLoading = false;
      }
    });
  }

  eliminar(id: number) {
    if (!id || !confirm('¿Eliminar este producto?')) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      this.mostrarMensaje('Necesita iniciar sesión como admin');
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.delete(`${this.apiUrl}/${id}`, { headers }).subscribe({
      next: () => {
        this.productos = this.productos.filter(p => p.id !== id);
        this.mostrarMensaje('Producto eliminado');
      },
      error: () => {
        this.mostrarMensaje('Error al eliminar');
      }
    });
  }
  
  private mostrarMensaje(mensaje: string) {
    this.mensaje = mensaje;
    setTimeout(() => this.mensaje = null, 3000);
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath || imagePath === 'default.jpg') {
      return 'assets/default-product.jpg';
    }
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Determine server base URL
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
    const serverBaseUrl = isDevelopment ? 'http://localhost:3000' : 'http://192.168.72.159';
    
    return `${serverBaseUrl}/${imagePath}`;
  }
}