import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-formulario',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './formulario.component.html',
  styleUrls: ['./formulario.component.css']
})
export class FormularioComponent implements OnInit {
  private apiUrl = 'http://localhost:3000/productos';
  errorMessage: string | null = null;
  formulario: FormGroup;
  
  // For image preview
  imagenPreview: SafeUrl | null = null;
  archivoImagen: File | null = null;
  
  // For editing mode
  editMode = false;
  productId: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer
  ) {
    this.formulario = this.fb.group({
      nombre: ['', Validators.required],
      precio: ['', [Validators.required, Validators.min(1)]],
      descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
      tipoProducto: ['', Validators.required],
      productoOferta: [false],
      stock: [1, [Validators.required, Validators.min(0)]]
    });
  }
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.editMode = true;
        this.productId = params['id'];
        this.cargarProducto(this.productId);
      }
    });
  }

  cargarProducto(id: string | null): void {
    if (!id) return;
    
    this.errorMessage = 'Cargando producto...';
    
    const token = localStorage.getItem('token');
    if (!token) {
      this.errorMessage = 'Debe iniciar sesión como administrador';
      setTimeout(() => this.router.navigate(['/login']), 3000);
      return;
    }
    
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.get<any>(`${this.apiUrl}/${id}`, { headers }).subscribe({
      next: (producto) => {
        this.formulario.patchValue({
          nombre: producto.nombre,
          precio: producto.precio,
          descripcion: producto.descripcion,
          tipoProducto: producto.tipo_producto,
          productoOferta: producto.producto_oferta,
          stock: producto.stock
        });
        
        if (producto.imagen && producto.imagen !== 'default.jpg') {
          const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1';
          const serverBaseUrl = isDevelopment ? 'http://localhost:3000' : 'http://192.168.72.159';
          
          this.imagenPreview = this.sanitizer.bypassSecurityTrustUrl(
            `${serverBaseUrl}/${producto.imagen}`
          );
        }
        
        this.errorMessage = null;
      },
      error: (error) => {
        if (error.error && typeof error.error === 'object' && error.error.error) {
          this.errorMessage = error.error.error;
        } else if (typeof error.error === 'string') {
          this.errorMessage = error.error;
        } else {
          this.errorMessage = `Error ${error.status}: No se pudo cargar el producto`;
        }
        
        if (error.status === 401) {
          localStorage.removeItem('token');
          alert('Su sesión ha expirado. Por favor inicie sesión nuevamente.');
          this.router.navigate(['/login']);
        }
      }
    });
  }
  
  onImagenSeleccionada(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    this.archivoImagen = input.files[0];
    
    // Validate file type
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!tiposPermitidos.includes(this.archivoImagen.type)) {
      this.errorMessage = 'Tipo de archivo no permitido. Use JPEG, PNG, GIF o WEBP';
      this.archivoImagen = null;
      this.imagenPreview = null;
      return;
    }
    
    // Validate file size (5MB max)
    if (this.archivoImagen.size > 5 * 1024 * 1024) {
      this.errorMessage = 'La imagen es demasiado grande (máximo 5MB)';
      this.archivoImagen = null;
      this.imagenPreview = null;
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      this.imagenPreview = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
    };
    reader.readAsDataURL(this.archivoImagen);
  }

  quitarImagen() {
    this.archivoImagen = null;
    this.imagenPreview = null;
  }

  enviarFormulario() {
    if (this.formulario.invalid) return;

    this.errorMessage = this.editMode ? 'Actualizando...' : 'Enviando...';
    
    const token = localStorage.getItem('token');
    if (!token) {
      this.errorMessage = 'Debe iniciar sesión como administrador';
      setTimeout(() => this.router.navigate(['/login']), 3000);
      return;
    }

    const formData = new FormData();
    formData.append('nombre', this.formulario.value.nombre || '');
    formData.append('precio', String(Number(this.formulario.value.precio) || 0));
    formData.append('descripcion', this.formulario.value.descripcion || '');
    formData.append('tipo_producto', this.formulario.value.tipoProducto || '');
    formData.append('producto_oferta', String(Boolean(this.formulario.value.productoOferta)));
    formData.append('stock', String(Number(this.formulario.value.stock) || 0));
    
    if (this.archivoImagen) {
      formData.append('imagen', this.archivoImagen);
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    // Choose between create or update
    const request = this.editMode && this.productId 
      ? this.http.put(`${this.apiUrl}/${this.productId}`, formData, { headers })
      : this.http.post(this.apiUrl, formData, { headers });
    
    request.subscribe({
      next: () => {
        alert(this.editMode ? '¡Producto actualizado correctamente!' : '¡Producto añadido correctamente!');
        this.formulario.reset({ productoOferta: false, stock: 1 });
        this.archivoImagen = null;
        this.imagenPreview = null;
        this.errorMessage = null;
        this.router.navigate(['/productos']);
      },
      error: (error: HttpErrorResponse) => {
        if (error.error && typeof error.error === 'object' && error.error.error) {
          this.errorMessage = error.error.error;
        } else if (typeof error.error === 'string') {
          this.errorMessage = error.error;
        } else {
          this.errorMessage = `Error ${error.status}: No se pudo ${this.editMode ? 'actualizar' : 'crear'} el producto`;
        }
        
        if (error.status === 401) {
          localStorage.removeItem('token');
          alert('Su sesión ha expirado. Por favor inicie sesión nuevamente.');
          this.router.navigate(['/login']);
        }
      }
    });
  }
}