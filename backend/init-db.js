const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('./db');

async function createTables() {
  await query(`CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    rol ENUM('admin', 'docente') NOT NULL DEFAULT 'docente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await query(`CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    documento VARCHAR(20) NOT NULL,
    fecha_nac VARCHAR(10),
    edad INT DEFAULT 0,
    telefono VARCHAR(15),
    madre VARCHAR(150),
    padre VARCHAR(150),
    condicion VARCHAR(200) NOT NULL,
    sede VARCHAR(50) DEFAULT 'Sede Principal',
    grado VARCHAR(20),
    grupo VARCHAR(10),
    maestro VARCHAR(150),
    ajustes TEXT,
    avances TEXT,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}

async function seedDefaults() {
  const admin = await query('SELECT id FROM users WHERE username = ?', ['admin']);
  if (admin.length === 0) {
    const hash = await bcrypt.hash('admin123', 10);
    await query('INSERT INTO users (id, username, password_hash, nombre_completo, rol) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), 'admin', hash, 'Administrador del Sistema', 'admin']);
  }

  const teacher = await query('SELECT id FROM users WHERE username = ?', ['docente']);
  if (teacher.length === 0) {
    const hash = await bcrypt.hash('docente123', 10);
    await query('INSERT INTO users (id, username, password_hash, nombre_completo, rol) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), 'docente', hash, 'Docente Demo', 'docente']);
  }
}

async function initDB() {
  await createTables();
  await seedDefaults();
}

async function resetDB() {
  await query('DROP TABLE IF EXISTS students');
  await query('DROP TABLE IF EXISTS users');
  await createTables();
  await seedDefaults();
}

module.exports = { initDB, resetDB, createTables };
