const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your_jwt_secret_key'; // Use env vars in production

// Environment setup
const isProduction = process.env.NODE_ENV === 'production';
const baseDir = isProduction ? '/var/www/html/nike' : path.join(__dirname, '..');
const publicDir = path.join(baseDir, 'public');
const uploadsDir = path.join(publicDir, 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'producto-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 *1024 }, // 5MB 
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      return cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// Serve static files in development mode
if (!isProduction) {
  app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
}

// Database connection
const pool = mysql.createPool({
  host: '192.168.72.159', 
  user: 'admin', 
  password: 'password', 
  database: 'nike',
  waitForConnections: true, 
  connectionLimit: 10
});

// Auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) { res.status(401).json({ error: 'Invalid token' }); }
};

const isAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
};

// Error handler
const handleError = (res, err) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
};

// AUTH ROUTES
// Register
app.post('/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password)
      return res.status(400).json({ error: 'All fields required' });
    
    const [users] = await pool.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (users.length > 0)
      return res.status(400).json({ error: 'Email already registered' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, hashedPassword, 'cliente']
    );
    res.status(201).json({ message: 'User registered', userId: result.insertId });
  } catch (err) { handleError(res, err); }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) 
      return res.status(400).json({ error: 'Email and password required' });
    
    const [users] = await pool.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (users.length === 0 || !(await bcrypt.compare(password, users[0].password)))
      return res.status(401).json({ error: 'Invalid credentials' });
    
    const user = users[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }
    });
  } catch (err) { handleError(res, err); }
});

// PRODUCT ROUTES
// Get all products
app.get('/productos', async (req, res) => {
  try {
    const [products] = await pool.execute('SELECT * FROM productos');
    res.json(products);
  } catch (err) { handleError(res, err); }
});

// Get product by ID
app.get('/productos/:id', async (req, res) => {
  try {
    const [products] = await pool.execute('SELECT * FROM productos WHERE id = ?', [req.params.id]);
    if (products.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(products[0]);
  } catch (err) { handleError(res, err); }
});

// Create product (admin only)
app.post('/productos', auth, isAdmin, upload.single('imagen'), async (req, res) => {
  try {
    // Parse fields with proper type conversion
    const nombre = req.body.nombre;
    const precio = parseFloat(req.body.precio) || 0;
    const descripcion = req.body.descripcion || '';
    const tipo_producto = req.body.tipo_producto || '';
    const producto_oferta = req.body.producto_oferta === 'true' || req.body.producto_oferta === true;
    const stock = parseInt(req.body.stock) || 0;
    
    // Set image path
    let imagen = 'default.jpg';
    if (req.file) {
      imagen = `uploads/${req.file.filename}`;
    }
    
    // Insert into database
    const [result] = await pool.execute(
      'INSERT INTO productos (nombre, precio, descripcion, tipo_producto, producto_oferta, imagen, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, precio, descripcion, tipo_producto, producto_oferta, imagen, stock]
    );
    
    res.status(201).json({ 
      message: 'Product created', 
      id: result.insertId, 
      imagen 
    });
  } catch (err) {
    // Clean up uploaded file on error
    if (req.file) {
      try {
        const filePath = path.join(uploadsDir, req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupErr) {}
    }
    res.status(500).json({ error: 'Error al crear el producto.' });
  }
});

// Update product (admin only)
app.put('/productos/:id', auth, isAdmin, upload.single('imagen'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio, descripcion, tipo_producto, producto_oferta, stock } = req.body;
    
    // Get current product
    const [products] = await pool.execute('SELECT imagen FROM productos WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    let imagen = products[0].imagen;
    
    // Handle image update
    if (req.file) {
      imagen = `uploads/${req.file.filename}`;
      
      // Delete old image if not default
      if (products[0].imagen !== 'default.jpg' && products[0].imagen.startsWith('uploads/')) {
        const oldImagePath = path.join(baseDir, products[0].imagen);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }
    
    // Update product
    await pool.execute(
      'UPDATE productos SET nombre = ?, precio = ?, descripcion = ?, tipo_producto = ?, producto_oferta = ?, imagen = ?, stock = ? WHERE id = ?',
      [nombre, precio, descripcion, tipo_producto, producto_oferta === 'true', imagen, stock, id]
    );
    
    res.json({ message: 'Product updated', imagen });
  } catch (err) {
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupErr) {}
    }
    handleError(res, err);
  }
});

// Delete product (admin only)
app.delete('/productos/:id', auth, isAdmin, async (req, res) => {
  try {
    const [products] = await pool.execute('SELECT imagen FROM productos WHERE id = ?', [req.params.id]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const imagePath = products[0].imagen;
    const [result] = await pool.execute('DELETE FROM productos WHERE id = ?', [req.params.id]);
    
    // Delete image file if not default
    if (result.affectedRows > 0 && imagePath !== 'default.jpg' && imagePath.startsWith('uploads/')) {
      const fullImagePath = path.join(baseDir, imagePath);
      if (fs.existsSync(fullImagePath)) {
        fs.unlinkSync(fullImagePath);
      }
    }
    
    res.json({ message: 'Product deleted' });
  } catch (err) {
    handleError(res, err);
  }
});

// USER ROUTES
// Get profile
app.get('/usuarios/perfil', auth, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, nombre, email, rol FROM usuarios WHERE id = ?', [req.user.id]
    );
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(users[0]);
  } catch (err) { handleError(res, err); }
});

// Update profile
app.put('/usuarios/perfil', auth, async (req, res) => {
  try {
    const { nombre, email } = req.body;
    if (!nombre || !email)
      return res.status(400).json({ error: 'Name and email required' });
    
    await pool.execute(
      'UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?',
      [nombre, email, req.user.id]
    );
    res.json({ message: 'Profile updated' });
  } catch (err) { handleError(res, err); }
});

// Change password
app.put('/usuarios/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'Both passwords required' });
    
    const [users] = await pool.execute(
      'SELECT password FROM usuarios WHERE id = ?', [req.user.id]
    );
    
    if (users.length === 0 || !(await bcrypt.compare(currentPassword, users[0].password)))
      return res.status(401).json({ error: 'Current password incorrect' });
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );
    res.json({ message: 'Password updated' });
  } catch (err) { handleError(res, err); }
});

// CART ROUTES
// Create cart
app.post('/carritos', auth, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'INSERT INTO carritos (usuario_id) VALUES (?)', [req.user.id]
    );
    const cartId = result.insertId;
    
    // Set 10-minute expiration
    setTimeout(async () => {
      try {
        const [carts] = await pool.execute('SELECT * FROM carritos WHERE id = ?', [cartId]);
        if (carts.length === 0) return;
        
        // Return stock and delete cart
        const conn = await pool.getConnection();
        await conn.beginTransaction();
        try {
          const [items] = await conn.execute(
            'SELECT producto_id, cantidad FROM carrito_productos WHERE carrito_id = ?',
            [cartId]
          );
          
          for (const item of items) {
            await conn.execute(
              'UPDATE productos SET stock = stock + ? WHERE id = ?',
              [item.cantidad, item.producto_id]
            );
          }
          
          await conn.execute('DELETE FROM carrito_productos WHERE carrito_id = ?', [cartId]);
          await conn.execute('DELETE FROM carritos WHERE id = ?', [cartId]);
          await conn.commit();
        } catch (err) {
          await conn.rollback();
          throw err;
        } finally {
          conn.release();
        }
      } catch (err) { console.error('Cart cleanup error:', err); }
    }, 600000); // 10 minutes
    
    res.status(201).json({ id: cartId, expiresIn: '10 minutes' });
  } catch (err) { handleError(res, err); }
});

// Get active cart
app.get('/carritos/usuario', auth, async (req, res) => {
  try {
    const [carts] = await pool.execute(
      'SELECT id, created_at FROM carritos WHERE usuario_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );
    
    if (carts.length === 0) return res.json({ message: 'No active cart', items: [] });
    
    const cartId = carts[0].id;
    const [items] = await pool.execute(
      `SELECT cp.producto_id, cp.cantidad, p.nombre, p.precio, p.imagen
       FROM carrito_productos cp JOIN productos p ON cp.producto_id = p.id
       WHERE cp.carrito_id = ?`,
      [cartId]
    );
    
    res.json({
      id: cartId,
      created_at: carts[0].created_at,
      items,
      total: items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
    });
  } catch (err) { handleError(res, err); }
});

// Add product to cart
app.post('/carritos/:id/productos', auth, async (req, res) => {
  try {
    const { id: cartId } = req.params;
    const { productoId, cantidad } = req.body;
    
    // Validate input
    if (!productoId || !cantidad || cantidad <= 0)
      return res.status(400).json({ error: 'Valid product and quantity required' });
    
    // Verify cart ownership and check stock
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    
    try {
      const [carts] = await conn.execute(
        'SELECT usuario_id FROM carritos WHERE id = ?', [cartId]
      );
      
      if (carts.length === 0 || carts[0].usuario_id !== req.user.id) {
        await conn.rollback();
        return res.status(403).json({ error: 'Cart access denied' });
      }
      
      const [products] = await conn.execute(
        'SELECT stock FROM productos WHERE id = ?', [productoId]
      );
      
      if (products.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: 'Product not found' });
      }
      
      if (products[0].stock < cantidad) {
        await conn.rollback();
        return res.status(400).json({ 
          error: 'Not enough stock', 
          available: products[0].stock 
        });
      }
      
      // Update product stock
      await conn.execute(
        'UPDATE productos SET stock = stock - ? WHERE id = ?',
        [cantidad, productoId]
      );
      
      // Check if product already in cart
      const [cartItems] = await conn.execute(
        'SELECT id, cantidad FROM carrito_productos WHERE carrito_id = ? AND producto_id = ?',
        [cartId, productoId]
      );
      
      if (cartItems.length > 0) {
        await conn.execute(
          'UPDATE carrito_productos SET cantidad = cantidad + ? WHERE id = ?',
          [cantidad, cartItems[0].id]
        );
      } else {
        await conn.execute(
          'INSERT INTO carrito_productos (carrito_id, producto_id, cantidad) VALUES (?, ?, ?)',
          [cartId, productoId, cantidad]
        );
      }
      
      await conn.commit();
      res.json({ message: 'Product added to cart' });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) { handleError(res, err); }
});

// Remove from cart
app.delete('/carritos/:cartId/productos/:productId', auth, async (req, res) => {
  try {
    const { cartId, productId } = req.params;
    const conn = await pool.getConnection();
    
    try {
      await conn.beginTransaction();
      
      // Verify cart ownership
      const [carts] = await conn.execute(
        'SELECT usuario_id FROM carritos WHERE id = ?', [cartId]
      );
      
      if (carts.length === 0 || carts[0].usuario_id !== req.user.id) {
        await conn.rollback();
        return res.status(403).json({ error: 'Cart access denied' });
      }
      
      // Get product quantity in cart
      const [items] = await conn.execute(
        'SELECT cantidad FROM carrito_productos WHERE carrito_id = ? AND producto_id = ?',
        [cartId, productId]
      );
      
      if (items.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: 'Product not in cart' });
      }
      
      // Return stock and remove from cart
      await conn.execute(
        'UPDATE productos SET stock = stock + ? WHERE id = ?',
        [items[0].cantidad, productId]
      );
      
      await conn.execute(
        'DELETE FROM carrito_productos WHERE carrito_id = ? AND producto_id = ?',
        [cartId, productId]
      );
      
      await conn.commit();
      res.json({ message: 'Product removed from cart' });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) { handleError(res, err); }
});

// Checkout
app.post('/carritos/:id/checkout', auth, async (req, res) => {
  try {
    const { id: cartId } = req.params;
    const conn = await pool.getConnection();
    
    try {
      await conn.beginTransaction();
      
      // Verify cart ownership
      const [carts] = await conn.execute(
        'SELECT usuario_id FROM carritos WHERE id = ?', [cartId]
      );
      
      if (carts.length === 0 || carts[0].usuario_id !== req.user.id) {
        await conn.rollback();
        return res.status(403).json({ error: 'Cart access denied' });
      }
      
      // Get cart items
      const [items] = await conn.execute(
        `SELECT cp.producto_id, cp.cantidad, p.precio
         FROM carrito_productos cp JOIN productos p ON cp.producto_id = p.id
         WHERE cp.carrito_id = ?`, [cartId]
      );
      
      if (items.length === 0) {
        await conn.rollback();
        return res.status(400).json({ error: 'Cart is empty' });
      }
      
      const total = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
      
      // Create purchase
      const [purchaseResult] = await conn.execute(
        'INSERT INTO compras (usuario_id, total) VALUES (?, ?)',
        [req.user.id, total]
      );
      
      const purchaseId = purchaseResult.insertId;
      
      // Add purchase items
      for (const item of items) {
        await conn.execute(
          'INSERT INTO compra_productos (compra_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
          [purchaseId, item.producto_id, item.cantidad, item.precio]
        );
      }
      
      // Delete cart
      await conn.execute('DELETE FROM carrito_productos WHERE carrito_id = ?', [cartId]);
      await conn.execute('DELETE FROM carritos WHERE id = ?', [cartId]);
      
      await conn.commit();
      res.json({ message: 'Purchase completed', purchaseId, total });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) { handleError(res, err); }
});

// PURCHASE HISTORY
// User's purchase history
app.get('/compras', auth, async (req, res) => {
  try {
    const [purchases] = await pool.execute(
      'SELECT id, total, created_at FROM compras WHERE usuario_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(purchases);
  } catch (err) { handleError(res, err); }
});

// Purchase details
app.get('/compras/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get purchase and verify access
    const [purchases] = await pool.execute(
      'SELECT usuario_id FROM compras WHERE id = ?', [id]
    );
    
    if (purchases.length === 0) 
      return res.status(404).json({ error: 'Purchase not found' });
    
    if (purchases[0].usuario_id !== req.user.id && req.user.rol !== 'admin')
      return res.status(403).json({ error: 'Access denied' });
    
    // Get purchase details
    const [details] = await pool.execute(
      `SELECT c.id, c.total, c.created_at, u.nombre as usuario_nombre
       FROM compras c JOIN usuarios u ON c.usuario_id = u.id WHERE c.id = ?`,
      [id]
    );
    
    const [items] = await pool.execute(
      `SELECT cp.producto_id, cp.cantidad, cp.precio_unitario, p.nombre, p.imagen
       FROM compra_productos cp JOIN productos p ON cp.producto_id = p.id
       WHERE cp.compra_id = ?`,
      [id]
    );
    
    res.json({ ...details[0], productos: items });
  } catch (err) { handleError(res, err); }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));