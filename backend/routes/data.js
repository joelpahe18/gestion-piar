const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { createTables } = require('../init-db');

const router = express.Router();

router.get('/export', authenticate, async (req, res) => {
  try {
    const students = await query('SELECT * FROM students ORDER BY nombre');
    if (students.length === 0) {
      return res.status(400).json({ error: 'No hay estudiantes registrados para exportar.' });
    }
    res.json({ students });
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Error al exportar datos.' });
  }
});

router.post('/import', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, mode } = req.body;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'El archivo no contiene registros válidos.' });
    }
    if (!data[0].nombre) {
      return res.status(400).json({ error: 'El archivo no contiene registros válidos.' });
    }

    if (mode === 'replace') {
      await query('DELETE FROM students');
    }

    for (const s of data) {
      const sid = s.id || uuidv4();
      await query(
        `INSERT INTO students
          (id, nombre, documento, fecha_nac, edad, telefono, madre, padre,
           condicion, sede, grado, grupo, maestro, ajustes, avances)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
          nombre=VALUES(nombre), documento=VALUES(documento), fecha_nac=VALUES(fecha_nac),
          edad=VALUES(edad), telefono=VALUES(telefono), madre=VALUES(madre), padre=VALUES(padre),
          condicion=VALUES(condicion), sede=VALUES(sede), grado=VALUES(grado), grupo=VALUES(grupo),
          maestro=VALUES(maestro), ajustes=VALUES(ajustes), avances=VALUES(avances)`,
        [sid, s.nombre, s.documento || '', s.fecha_nac || '', s.edad || 0,
         s.telefono || '', s.madre || '', s.padre || '',
         s.condicion || '', s.sede || 'Sede Principal', s.grado || '',
         s.grupo || '', s.maestro || '', s.ajustes || '', s.avances || '']
      );
    }

    res.json({ message: 'Registros importados correctamente.' });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: 'Error al importar datos.' });
  }
});

router.post('/reset', authenticate, requireAdmin, async (req, res) => {
  try {
    await query('DROP TABLE IF EXISTS students');
    await query('DROP TABLE IF EXISTS users');
    await createTables();

    const adminHash = await bcrypt.hash('admin123', 10);
    await query('INSERT INTO users (id, username, password_hash, nombre_completo, rol) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), 'admin', adminHash, 'Administrador del Sistema', 'admin']);

    const teacherHash = await bcrypt.hash('docente123', 10);
    await query('INSERT INTO users (id, username, password_hash, nombre_completo, rol) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), 'docente', teacherHash, 'Docente Demo', 'docente']);

    res.json({ message: 'Base de datos reiniciada.' });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Error al reiniciar base de datos.' });
  }
});

module.exports = router;
