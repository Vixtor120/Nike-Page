import { TestBed } from '@angular/core/testing';
import { ProductoService } from './producto.service';

describe('ProductoService', () => {
  let service: ProductoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a product to the list', () => {
    const producto = { id: 1, nombre: 'Test', precio: 100, descripcion: '', tipo_producto: '', producto_oferta: false, imagen: '', stock: 10 };
    service.addProducto(producto);
    expect(service.getProductos().length).toBe(1);
    expect(service.getProductos()[0]).toEqual(producto);
  });
});