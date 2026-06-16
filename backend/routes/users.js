const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const rows = await query('SELECT id, username, nombre_completo, rol, created_at FROM users ORDER BY username');
    res.json({ users: rows });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Error al cargar usuarios.' });
  }
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { username, nombre, password } = req.body;
    if (!username || !nombre || !password) {
      return res.status(400).json({ error: 'Completa todos los campos.' });
    }

    const existing = await query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(409).json({ error: `El nombre de usuario "${username}" ya existe.` });
    }

    const hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await query('INSERT INTO users (id, username, password_hash, nombre_completo, rol) VALUES (?, ?, ?, ?, ?)',
      [id, username, hash, nombre, 'docente']);

    res.status(201).json({ message: 'Usuario creado correctamente.', id });
  } catch (err) {
    console.error('Create user error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El nombre de usuario ya existe.' });
    }
    res.status(500).json({ error: 'Error al crear usuario.' });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario.' });
    }
    await query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'Usuario eliminado correctamente.' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Error al eliminar usuario.' });
  }
});

module.exports = router;
