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

  it('should create', () => {
    httpClientSpy.get.and.returnValue(of([]));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load products on initialization', () => {
    httpClientSpy.get.and.returnValue(of([]));
    spyOn(component as any, 'cargarProductos').and.callThrough();
    fixture.detectChanges();
    expect((component as any).cargarProductos).toHaveBeenCalled();
  });

  it('should display an error message if products fail to load', () => {
    httpClientSpy.get.and.returnValue(throwError(() => new Error('Error al cargar')));
    fixture.detectChanges();
    // Make sure the error property gets set properly in the component
    expect(component.error).toBe('Error al cargar los productos');
  });
});