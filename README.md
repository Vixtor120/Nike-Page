# Nike Page - Angular E-Commerce Project

A full-featured e-commerce application built with Angular and Node.js, showcasing Nike products with shopping cart functionality and user authentication.

![Nike Page Screenshot](assets/screenshot.png)

## 🚀 Features

- **Product Catalog**: Browse a complete catalog of Nike products with filtering options
- **User Authentication**: Register and login to manage your account
- **Shopping Cart System**: Add products to cart, adjust quantities, and checkout
- **User Profiles**: View and update user information
- **Admin Dashboard**: Manage products (add, edit, delete) with admin privileges
- **Responsive Design**: Full mobile and desktop compatibility

## 💻 Technology Stack

- **Frontend**: Angular 19, TailwindCSS
- **Backend**: Node.js, Express
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Image Storage**: Local file system with multer

## 📋 Prerequisites

- Node.js (v18+)
- npm or yarn
- MySQL database

## 🔧 Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/nike-page.git
cd nike-page
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Configure the database

Create a MySQL database and run the SQL scripts found in `database/database.txt`.

### 4. Configure the server

Navigate to the database directory and install server dependencies:

```bash
cd database
npm install
```

Edit the database connection in `server.js` to match your MySQL configuration.

### 5. Start the development server

From the project root:

```bash
# Start the backend server
cd database
node server.js

# In another terminal, start the Angular development server
cd ..
ng serve
```

The application will be available at `http://localhost:4200/`.

## 🗄️ Database Structure

The application uses MySQL with the following main tables:
- **usuarios**: User data and authentication information
- **productos**: Product catalog information
- **carritos**: Shopping cart data
- **carrito_productos**: Products in cart with quantities
- **compras**: Completed purchase records
- **compra_productos**: Products in completed purchases

See the complete schema in `database/database.txt`.

## 👤 Authentication & Authorization

The application includes a complete authentication system:
- User registration with password hashing
- JWT-based authentication
- Role-based access control (admin vs client)
- Protected routes for authenticated users

## 📱 API Documentation

### Product Endpoints
- `GET /productos`: Fetch all products
- `GET /productos/:id`: Fetch single product
- `POST /productos`: Create product (admin only)
- `PUT /productos/:id`: Update product (admin only)
- `DELETE /productos/:id`: Delete product (admin only)

### Cart Endpoints
- `POST /carritos`: Create a new cart
- `GET /carritos/usuario`: Get user's active cart
- `POST /carritos/:id/productos`: Add product to cart
- `DELETE /carritos/:cartId/productos/:productId`: Remove product from cart
- `POST /carritos/:id/checkout`: Complete purchase

### User Endpoints
- `POST /register`: Register new user
- `POST /login`: User login
- `GET /usuarios/perfil`: Get user profile
- `PUT /usuarios/perfil`: Update user profile
- `PUT /usuarios/password`: Change password

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
