import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductosComponent } from './productos.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

describe('ProductosComponent', () => {
  let component: ProductosComponent;
  let fixture: ComponentFixture<ProductosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductosComponent, HttpClientTestingModule, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load products on initialization', () => {
    spyOn(component as any, 'cargarProductos').and.returnValue(of([]));
    component.ngOnInit();
    expect((component as any).cargarProductos).toHaveBeenCalled();
  });

  it('should display an error message if products fail to load', () => {
    spyOn(component as any, 'cargarProductos').and.returnValue(throwError({ error: 'Error al cargar' }));
    component.ngOnInit();
    expect(component.error).toBe('Error al cargar los productos');
  });
});