const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Conexión a la base de datos MySQL
const db = mysql.createConnection({
  host: '192.168.72.159', // Cambia esto por la IP de tu máquina virtual
  user: 'admin', // Usuario creado en MySQL
  password: 'password', // Contraseña del usuario
  database: 'nike' // Nombre de la base de datos
});

db.connect(err => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    process.exit(1);
  }
  console.log('Conexión a la base de datos exitosa.');
});

// Rutas de la API

// GET: Obtener todos los productos
app.get('/productos', (req, res) => {
  db.query('SELECT * FROM productos', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener los productos.' });
    }
    res.json(results);
  });
});

// GETBYID: Obtener un producto por ID
app.get('/productos/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM productos WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener el producto.' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    res.json(results[0]);
  });
});

// POST: Crear un nuevo producto
app.post('/productos', (req, res) => {
  const { nombre, precio, descripcion, tipo_producto, producto_oferta, imagen, stock } = req.body;
  const query = 'INSERT INTO productos (nombre, precio, descripcion, tipo_producto, producto_oferta, imagen, stock) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(query, [nombre, precio, descripcion, tipo_producto, producto_oferta, imagen, stock], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al crear el producto.' });
    }
    res.status(201).json({ message: 'Producto creado exitosamente.', id: results.insertId });
  });
});

// PUT: Actualizar un producto por ID
app.put('/productos/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, precio, descripcion, tipo_producto, producto_oferta, imagen, stock } = req.body;
  const query = 'UPDATE productos SET nombre = ?, precio = ?, descripcion = ?, tipo_producto = ?, producto_oferta = ?, imagen = ?, stock = ? WHERE id = ?';
  db.query(query, [nombre, precio, descripcion, tipo_producto, producto_oferta, imagen, stock, id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al actualizar el producto.' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    res.json({ message: 'Producto actualizado exitosamente.' });
  });
});

// DELETE: Eliminar un producto por ID
app.delete('/productos/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM productos WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al eliminar el producto.' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    res.json({ message: 'Producto eliminado exitosamente.' });
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});