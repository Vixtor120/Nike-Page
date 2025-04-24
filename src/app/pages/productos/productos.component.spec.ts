import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductosComponent } from './productos.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

describe('ProductosComponent', () => {
  let component: ProductosComponent;
  let fixture: ComponentFixture<ProductosComponent>;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(async () => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get']);
    
    await TestBed.configureTestingModule({
      imports: [ProductosComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: HttpClient, useValue: httpClientSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductosComponent);
    component = fixture.componentInstance;
  });

  it('debería crearse', () => {
    httpClientSpy.get.and.returnValue(of([]));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('debería cargar los productos al inicializar', () => {
    httpClientSpy.get.and.returnValue(of([]));
    spyOn(component as any, 'cargarProductos').and.callThrough();
    fixture.detectChanges();
    expect((component as any).cargarProductos).toHaveBeenCalled();
  });

  it('debería mostrar un mensaje de error si falla la carga de productos', () => {
    httpClientSpy.get.and.returnValue(throwError(() => new Error('Error al cargar')));
    fixture.detectChanges();
    // Asegúrate de que la propiedad de error se establezca correctamente en el componente
    expect(component.error).toBe('Error al cargar los productos');
  });
});