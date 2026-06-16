const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos.' });
    }

    const users = await query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, rol: user.rol, nombre_completo: user.nombre_completo },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        nombre_completo: user.nombre_completo,
        rol: user.rol,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres.' });
    }

    const isSelf = req.user.id === userId;

    if (isSelf) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Ingresa tu contraseña actual.' });
      }
      const users = await query('SELECT password_hash FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }
      const valid = await bcrypt.compare(currentPassword, users[0].password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
      }
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);
    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.post('/recovery/verify', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Nombre de usuario requerido.' });
    }

    const users = await query('SELECT id, username, nombre_completo FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'No se encontró un usuario con ese nombre.' });
    }

    res.json({ user: users[0] });
  } catch (err) {
    console.error('Recovery verify error:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.post('/recovery/reset', async (req, res) => {
  try {
    const { username, newPassword } = req.body;
    if (!username || !newPassword) {
      return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres.' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = ? WHERE username = ?', [hash, username]);
    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    console.error('Recovery reset error:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
