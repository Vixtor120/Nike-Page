import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormularioComponent } from './formulario.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BehaviorSubject } from 'rxjs';

describe('FormularioComponent', () => {
  let component: FormularioComponent;
  let fixture: ComponentFixture<FormularioComponent>;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    // Crear espías para los servicios
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['post', 'get', 'put']);
    
    // Mock AuthService con privilegios de administrador
    const currentUserSubject = new BehaviorSubject({
      id: 1,
      nombre: 'Admin User',
      email: 'admin@example.com',
      rol: 'admin'
    });
    
    authServiceSpy = jasmine.createSpyObj('AuthService',
      ['isLoggedIn', 'isAdmin', 'getToken'],
      { currentUser: currentUserSubject.asObservable() }
    );
    
    // Configurar métodos de los espías
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.isAdmin.and.returnValue(true);
    authServiceSpy.getToken.and.returnValue('fake-token');
    
    // Configurar respuestas HTTP
    // Asegurar que GET devuelva un array vacío para satisfacer .some()
    httpClientSpy.get.and.returnValue(of([])); 
    httpClientSpy.post.and.returnValue(of({ message: 'success' }));
    httpClientSpy.put.and.returnValue(of({ message: 'success' }));
    
    // Crear mock de ParamMap
    const paramMapMock = {
      get: jasmine.createSpy('get').and.returnValue(null),
      has: jasmine.createSpy('has').and.returnValue(false),
      getAll: jasmine.createSpy('getAll').and.returnValue([]),
      keys: jasmine.createSpy('keys').and.returnValue([])
    };
    
    await TestBed.configureTestingModule({
      imports: [
        FormularioComponent, 
        ReactiveFormsModule, 
        HttpClientTestingModule, 
        RouterTestingModule.withRoutes([])
      ],
      providers: [
        { provide: HttpClient, useValue: httpClientSpy },
        { provide: AuthService, useValue: authServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: paramMapMock
            },
            paramMap: of(paramMapMock),
            params: of({}),
            queryParams: of({}),
            queryParamMap: of(paramMapMock)
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioComponent);
    component = fixture.componentInstance;
    
    // Mock localStorage para el token (requisito común en escenarios de autenticación)
    spyOn(localStorage, 'getItem').and.callFake((key) => {
      if (key === 'token') return 'fake-token';
      return null;
    });
    
    // Si cargarProducto existe y se llama en ngOnInit, mockearlo para evitar efectos secundarios
    if (typeof component['cargarProducto'] === 'function') {
      spyOn<any>(component, 'cargarProducto').and.returnValue(of({}));
    }
    
    // Ejecutar ngOnInit
    fixture.detectChanges();
  });

  it('debería crearse', () => {
    expect(component).toBeTruthy();
  });

  it('debería enviar un formulario válido', (done) => {
    httpClientSpy.post.and.returnValue(of({ message: 'success' }));
    
    // Establecer valores válidos en el formulario
    component.formulario.setValue({
      nombre: 'Producto Test',
      precio: 100,
      descripcion: 'Descripción válida',
      tipoProducto: 'Calzado',
      productoOferta: false,
      stock: 10
    });
    
    expect(component.formulario.valid).toBeTrue();
    component.enviarFormulario();
    fixture.detectChanges();
    
    setTimeout(() => {
      expect(httpClientSpy.post).toHaveBeenCalled();
      done();
    }, 100);
  });

  it('debería mostrar un mensaje de error si el envío del formulario falla', (done) => {
    // Proveer la estructura exacta del error que espera el componente
    const errorResponse = { error: 'Error al enviar' };
    httpClientSpy.post.and.returnValue(throwError(() => errorResponse));
    
    // Establecer valores válidos en el formulario
    component.formulario.setValue({
      nombre: 'Producto Test',
      precio: 100,
      descripcion: 'Descripción válida',
      tipoProducto: 'Calzado',
      productoOferta: false,
      stock: 10
    });
    
    component.enviarFormulario();
    fixture.detectChanges();
    
    setTimeout(() => {
      expect(component.errorMessage).toBe('Error al enviar');
      done();
    }, 100);
  });
});