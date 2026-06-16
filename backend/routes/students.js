const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM students ORDER BY nombre');
    res.json({ students: rows });
  } catch (err) {
    console.error('Get students error:', err);
    res.status(500).json({ error: 'Error al cargar estudiantes.' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado.' });
    }
    res.json({ student: rows[0] });
  } catch (err) {
    console.error('Get student error:', err);
    res.status(500).json({ error: 'Error al obtener estudiante.' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { nombre, documento, fecha_nac, edad, telefono, madre, padre, condicion, sede, grado, grupo, maestro, ajustes, avances } = req.body;

    const dup = await query('SELECT id, nombre FROM students WHERE documento = ?', [documento]);
    if (dup.length > 0) {
      return res.status(409).json({ error: `Ya existe un estudiante registrado con el documento ${documento} (${dup[0].nombre}).` });
    }

    const id = uuidv4();
    await query(
      `INSERT INTO students (id, nombre, documento, fecha_nac, edad, telefono, madre, padre,
        condicion, sede, grado, grupo, maestro, ajustes, avances, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, nombre, documento, fecha_nac || null, edad || 0, telefono || null,
       madre || null, padre || null, condicion, sede || 'Sede Principal', grado || null,
       grupo || null, maestro || null, ajustes || null, avances || null, req.user.id]
    );

    res.status(201).json({ message: 'Estudiante registrado correctamente.', id });
  } catch (err) {
    console.error('Create student error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un registro con ese documento.' });
    }
    res.status(500).json({ error: 'Error al guardar estudiante.' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { nombre, documento, fecha_nac, edad, telefono, madre, padre, condicion, sede, grado, grupo, maestro, ajustes, avances } = req.body;

    const dup = await query('SELECT id, nombre FROM students WHERE documento = ? AND id != ?', [documento, req.params.id]);
    if (dup.length > 0) {
      return res.status(409).json({ error: `Ya existe otro estudiante con el documento ${documento} (${dup[0].nombre}).` });
    }

    await query(
      `UPDATE students SET
        nombre=?, documento=?, fecha_nac=?, edad=?, telefono=?, madre=?, padre=?,
        condicion=?, sede=?, grado=?, grupo=?, maestro=?, ajustes=?, avances=?
       WHERE id=?`,
      [nombre, documento, fecha_nac || null, edad || 0, telefono || null,
       madre || null, padre || null, condicion, sede || 'Sede Principal', grado || null,
       grupo || null, maestro || null, ajustes || null, avances || null, req.params.id]
    );

    res.json({ message: 'Estudiante actualizado correctamente.' });
  } catch (err) {
    console.error('Update student error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un registro con ese documento.' });
    }
    res.status(500).json({ error: 'Error al actualizar estudiante.' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await query('DELETE FROM students WHERE id = ?', [req.params.id]);
    res.json({ message: 'Estudiante eliminado correctamente.' });
  } catch (err) {
    console.error('Delete student error:', err);
    res.status(500).json({ error: 'Error al eliminar estudiante.' });
  }
});

module.exports = router;
