export interface Producto {
  id?: number;
  nombre: string;
  precio: number;
  descripcion: string;
  tipoProducto: string;
  productoOferta: boolean;
  imagen: string;
  stock?: number;
}