import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CarritoComponent } from './carrito.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

describe('CarritoComponent', () => {
  let component: CarritoComponent;
  let fixture: ComponentFixture<CarritoComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    // Create mock auth service
    const currentUserSubject = new BehaviorSubject<any>(null);
    mockAuthService = jasmine.createSpyObj('AuthService', 
      ['isLoggedIn', 'isAdmin'], 
      { currentUser: currentUserSubject.asObservable() }
    );
    mockAuthService.isLoggedIn.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [
        CarritoComponent, 
        HttpClientTestingModule, 
        RouterTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => null
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CarritoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
