CREATE DATABASE IF NOT EXISTS gestion_piar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE gestion_piar;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(150) NOT NULL,
  rol ENUM('admin', 'docente') NOT NULL DEFAULT 'docente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS students (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
