import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

interface CartItem {
  producto_id: number;
  cantidad: number;
  nombre: string;
  precio: number;
  imagen: string;
}

interface Cart {
  id: number;
  created_at: string;
  items: CartItem[];
  total: number;
}

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './carrito.component.html',
  styleUrl: './carrito.component.css'
})
export class CarritoComponent implements OnInit {
  cart: Cart | null = null;
  isLoading = true;
  error: string | null = null;
  successMessage: string | null = null;
  
  private apiUrl = 'http://localhost:3000';

  constructor(
    private http: HttpClient,
    public authService: AuthService
  ) {}
  
  ngOnInit() {
    this.loadCart();
  }
  
  loadCart() {
    if (!this.authService.isLoggedIn()) {
      this.isLoading = false;
      this.error = 'Debes iniciar sesión para ver tu carrito';
      return;
    }
    
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.isLoading = true;
    this.error = null;
    
    this.http.get<any>(`${this.apiUrl}/carritos/usuario`, { headers }).subscribe({
      next: (response) => {
        this.cart = response;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar el carrito';
        this.isLoading = false;
        console.error(err);
      }
    });
  }
  
  removeItem(productId: number) {
    if (!this.cart || !this.cart.id) return;
    
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.delete(`${this.apiUrl}/carritos/${this.cart.id}/productos/${productId}`, { headers }).subscribe({
      next: () => {
        this.showMessage('Producto eliminado del carrito');
        this.loadCart();
      },
      error: (err) => {
        this.error = 'Error al eliminar el producto';
        console.error(err);
      }
    });
  }
  
  increaseQuantity(productId: number, currentQuantity: number) {
    if (!this.cart || !this.cart.id) return;
    if (currentQuantity >= 5) return; // Límite de 5 unidades
    
    const newQuantity = currentQuantity + 1;
    this.updateProductQuantity(productId, newQuantity);
  }
  
  decreaseQuantity(productId: number, currentQuantity: number) {
    if (!this.cart || !this.cart.id) return;
    if (currentQuantity <= 1) return; // Mínimo 1 unidad
    
    const newQuantity = currentQuantity - 1;
    this.updateProductQuantity(productId, newQuantity);
  }
  
  private updateProductQuantity(productId: number, newQuantity: number) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.put<any>(`${this.apiUrl}/carritos/${this.cart!.id}/productos/${productId}`, {
      cantidad: newQuantity
    }, { headers }).subscribe({
      next: () => {
        // Actualizar datos locales del carrito
        if (this.cart && this.cart.items) {
          const item = this.cart.items.find(i => i.producto_id === productId);
          if (item) {
            const oldQuantity = item.cantidad;
            item.cantidad = newQuantity;
            
            // Actualizar total del carrito
            this.cart.total += (newQuantity - oldQuantity) * item.precio;
          }
        }
      },
      error: (err) => {
        this.error = 'Error al actualizar la cantidad';
        console.error(err);
        // Recargar carrito para actualizar datos
        this.loadCart();
      }
    });
  }
  
  checkout() {
    if (!this.cart || !this.cart.id) return;
    
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.post<any>(`${this.apiUrl}/carritos/${this.cart.id}/checkout`, {}, { headers }).subscribe({
      next: (response) => {
        this.showMessage('¡Compra realizada con éxito!');
        this.cart = null; // Limpiar carrito después de la compra
        setTimeout(() => {
          window.location.href = '/productos';
        }, 2000);
      },
      error: (err) => {
        this.error = 'Error al procesar la compra';
        console.error(err);
      }
    });
  }
  
  createNewCart() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.post<any>(`${this.apiUrl}/carritos`, {}, { headers }).subscribe({
      next: (response) => {
        this.showMessage('Nuevo carrito creado');
        setTimeout(() => {
          window.location.href = '/productos';
        }, 1500);
      },
      error: (err) => {
        this.error = 'Error al crear un nuevo carrito';
        console.error(err);
      }
    });
  }
  
  private showMessage(message: string) {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
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
    const serverBaseUrl = isDevelopment ? 'http://localhost:3000' : 'http://192.0.0.1';
    
    return `${serverBaseUrl}/${imagePath}`;
  }
}
