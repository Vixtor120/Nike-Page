export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    nombre: string;
    email: string;
    rol: 'admin' | 'cliente'; // Explicitly defined as union of string literals
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}
