import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ProductosComponent } from './pages/productos/productos.component';
import { FormularioComponent } from './pages/formulario/formulario.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
    {path: '', redirectTo: 'home', pathMatch: 'full'}, // Redirect empty path to home
    {path: 'home', component: HomeComponent},
    {path: 'productos', component: ProductosComponent},
    {path: 'formulario', component: FormularioComponent, canActivate: [AdminGuard]},
    {path: 'formulario/:id', component: FormularioComponent, canActivate: [AdminGuard]},
    {path: 'login', component: LoginComponent},
    {path: 'register', component: RegisterComponent},
    {path: '**', redirectTo: 'home'} // Handle 404 by redirecting to home
];
