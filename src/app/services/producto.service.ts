import { Injectable } from '@angular/core';
import { Producto } from '../interfaces/producto.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private productos: Producto[] = [];

  // Obtener todos los productos
  getProductos() {
    return this.productos;
  }

  // Establecer la lista completa de productos
  setProductos(productos: Producto[]) {
    this.productos = productos;
  }

  // Añadir un nuevo producto
  addProducto(producto: Producto) {
    this.productos.push(producto);
  }
}
