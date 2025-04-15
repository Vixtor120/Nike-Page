import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormularioComponent } from './formulario.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

describe('FormularioComponent', () => {
  let component: FormularioComponent;
  let fixture: ComponentFixture<FormularioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioComponent, ReactiveFormsModule, HttpClientTestingModule, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should submit a valid form', () => {
    spyOn(component as any, 'procesarEnvioFormulario').and.returnValue(of({}));

    component.formulario.setValue({
      nombre: 'Producto Test',
      precio: 100,
      descripcion: 'Descripción válida',
      tipoProducto: 'Calzado',
      productoOferta: false,
      stock: 10
    });

    component.enviarFormulario();

    expect((component as any).procesarEnvioFormulario).toHaveBeenCalled();
  });

  it('should show an error message if the form submission fails', () => {
    spyOn(component as any, 'procesarEnvioFormulario').and.returnValue(throwError({ error: 'Error al enviar' }));

    component.formulario.setValue({
      nombre: 'Producto Test',
      precio: 100,
      descripcion: 'Descripción válida',
      tipoProducto: 'Calzado',
      productoOferta: false,
      stock: 10
    });

    component.enviarFormulario();

    expect(component.errorMessage).toBe('Error al enviar');
  });
});