-- =====================================================================
-- PROYECTO FINAL - BASE DE DATOS II
-- Sistema de Gestión de Citas Médicas para una Clínica
-- Motor: MariaDB
-- =====================================================================

DROP DATABASE IF EXISTS clinica_citas;
CREATE DATABASE clinica_citas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clinica_citas;

-- =====================================================================
-- 1. TABLAS (Normalizadas hasta 3FN)
-- =====================================================================

-- Especialidades médicas (evita repetir el nombre de la especialidad en cada médico)
CREATE TABLE especialidades (
    id_especialidad INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
) ENGINE=InnoDB;

-- Consultorios físicos de la clínica
CREATE TABLE consultorios (
    id_consultorio INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(10) NOT NULL UNIQUE,
    piso TINYINT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'General'
) ENGINE=InnoDB;

-- Médicos (cada médico tiene UNA especialidad -> FK, no se repite texto -> 3FN)
CREATE TABLE medicos (
    id_medico INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    apellido VARCHAR(60) NOT NULL,
    id_especialidad INT NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    fecha_ingreso DATE NOT NULL DEFAULT (CURRENT_DATE),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_medico_especialidad FOREIGN KEY (id_especialidad)
        REFERENCES especialidades(id_especialidad)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Pacientes
CREATE TABLE pacientes (
    id_paciente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    apellido VARCHAR(60) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    genero ENUM('M','F','Otro') NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    direccion VARCHAR(150),
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Horarios de disponibilidad de cada médico (día de semana + rango horario)
CREATE TABLE horarios_medicos (
    id_horario INT AUTO_INCREMENT PRIMARY KEY,
    id_medico INT NOT NULL,
    dia_semana TINYINT NOT NULL COMMENT '1=Lunes ... 7=Domingo',
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    CONSTRAINT fk_horario_medico FOREIGN KEY (id_medico)
        REFERENCES medicos(id_medico)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_horario CHECK (hora_fin > hora_inicio)
) ENGINE=InnoDB;

-- Citas (tabla transaccional central, relaciona paciente-medico-consultorio)
CREATE TABLE citas (
    id_cita INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente INT NOT NULL,
    id_medico INT NOT NULL,
    id_consultorio INT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    motivo VARCHAR(255),
    estado ENUM('Programada','Confirmada','Atendida','Cancelada','No asistió')
        NOT NULL DEFAULT 'Programada',
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cita_paciente FOREIGN KEY (id_paciente)
        REFERENCES pacientes(id_paciente)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_cita_medico FOREIGN KEY (id_medico)
        REFERENCES medicos(id_medico)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_cita_consultorio FOREIGN KEY (id_consultorio)
        REFERENCES consultorios(id_consultorio)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT uq_medico_fecha_hora UNIQUE (id_medico, fecha, hora)
) ENGINE=InnoDB;

-- Diagnósticos / resultado de la consulta (1 a 1 con cita atendida)
CREATE TABLE diagnosticos (
    id_diagnostico INT AUTO_INCREMENT PRIMARY KEY,
    id_cita INT NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    tratamiento TEXT,
    observaciones TEXT,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_diagnostico_cita FOREIGN KEY (id_cita)
        REFERENCES citas(id_cita)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Índices adicionales para consultas frecuentes
CREATE INDEX idx_citas_fecha ON citas(fecha);
CREATE INDEX idx_citas_estado ON citas(estado);
CREATE INDEX idx_pacientes_apellido ON pacientes(apellido);

-- =====================================================================
-- 2. VISTAS
-- =====================================================================

-- Vista 1: Detalle completo de citas (para la API y el dashboard)
CREATE OR REPLACE VIEW vista_citas_completas AS
SELECT
    c.id_cita,
    c.fecha,
    c.hora,
    c.estado,
    c.motivo,
    p.id_paciente,
    CONCAT(p.nombre, ' ', p.apellido) AS paciente,
    p.telefono AS telefono_paciente,
    m.id_medico,
    CONCAT(m.nombre, ' ', m.apellido) AS medico,
    e.nombre AS especialidad,
    co.numero AS consultorio,
    co.piso
FROM citas c
JOIN pacientes p ON p.id_paciente = c.id_paciente
JOIN medicos m ON m.id_medico = c.id_medico
JOIN especialidades e ON e.id_especialidad = m.id_especialidad
JOIN consultorios co ON co.id_consultorio = c.id_consultorio;

-- Vista 2: Estadísticas de citas por médico (útil para el tablero Power BI/Tableau)
CREATE OR REPLACE VIEW vista_estadisticas_medico AS
SELECT
    m.id_medico,
    CONCAT(m.nombre, ' ', m.apellido) AS medico,
    e.nombre AS especialidad,
    COUNT(c.id_cita) AS total_citas,
    SUM(CASE WHEN c.estado = 'Atendida' THEN 1 ELSE 0 END) AS citas_atendidas,
    SUM(CASE WHEN c.estado = 'Cancelada' THEN 1 ELSE 0 END) AS citas_canceladas,
    SUM(CASE WHEN c.estado = 'No asistió' THEN 1 ELSE 0 END) AS inasistencias
FROM medicos m
JOIN especialidades e ON e.id_especialidad = m.id_especialidad
LEFT JOIN citas c ON c.id_medico = m.id_medico
GROUP BY m.id_medico, medico, especialidad;

-- =====================================================================
-- 3. PROCEDIMIENTOS ALMACENADOS
-- =====================================================================

DELIMITER //

-- SP 1: Agendar una cita validando que el médico no tenga choque de horario
CREATE PROCEDURE sp_agendar_cita (
    IN p_id_paciente INT,
    IN p_id_medico INT,
    IN p_id_consultorio INT,
    IN p_fecha DATE,
    IN p_hora TIME,
    IN p_motivo VARCHAR(255),
    OUT p_resultado VARCHAR(100)
)
BEGIN
    DECLARE v_existe INT DEFAULT 0;

    SELECT COUNT(*) INTO v_existe
    FROM citas
    WHERE id_medico = p_id_medico
      AND fecha = p_fecha
      AND hora = p_hora
      AND estado NOT IN ('Cancelada');

    IF v_existe > 0 THEN
        SET p_resultado = 'ERROR: El médico ya tiene una cita en ese horario';
    ELSE
        INSERT INTO citas (id_paciente, id_medico, id_consultorio, fecha, hora, motivo)
        VALUES (p_id_paciente, p_id_medico, p_id_consultorio, p_fecha, p_hora, p_motivo);
        SET p_resultado = CONCAT('OK: Cita creada con id ', LAST_INSERT_ID());
    END IF;
END //

-- SP 2: Historial médico completo de un paciente (citas + diagnósticos)
CREATE PROCEDURE sp_historial_paciente (
    IN p_id_paciente INT
)
BEGIN
    SELECT
        c.id_cita,
        c.fecha,
        c.hora,
        c.estado,
        CONCAT(m.nombre, ' ', m.apellido) AS medico,
        e.nombre AS especialidad,
        d.descripcion AS diagnostico,
        d.tratamiento
    FROM citas c
    JOIN medicos m ON m.id_medico = c.id_medico
    JOIN especialidades e ON e.id_especialidad = m.id_especialidad
    LEFT JOIN diagnosticos d ON d.id_cita = c.id_cita
    WHERE c.id_paciente = p_id_paciente
    ORDER BY c.fecha DESC, c.hora DESC;
END //

DELIMITER ;

-- =====================================================================
-- 4. DATOS DE PRUEBA (útiles para probar la API, ETL y el dashboard)
-- =====================================================================

INSERT INTO especialidades (nombre, descripcion) VALUES
('Medicina General', 'Consulta médica general'),
('Pediatría', 'Atención a niños y adolescentes'),
('Cardiología', 'Enfermedades del corazón'),
('Dermatología', 'Enfermedades de la piel'),
('Ginecología', 'Salud reproductiva femenina');

INSERT INTO consultorios (numero, piso, tipo) VALUES
('101', 1, 'General'),
('102', 1, 'General'),
('201', 2, 'Especialidad'),
('202', 2, 'Especialidad');

INSERT INTO medicos (nombre, apellido, id_especialidad, telefono, email) VALUES
('Ana', 'Rodríguez', 1, '6000-1111', 'ana.rodriguez@clinica.com'),
('Carlos', 'Pérez', 2, '6000-2222', 'carlos.perez@clinica.com'),
('Luisa', 'Gómez', 3, '6000-3333', 'luisa.gomez@clinica.com'),
('Miguel', 'Torres', 4, '6000-4444', 'miguel.torres@clinica.com'),
('Sofía', 'Martínez', 5, '6000-5555', 'sofia.martinez@clinica.com');

INSERT INTO horarios_medicos (id_medico, dia_semana, hora_inicio, hora_fin) VALUES
(1, 1, '08:00:00', '12:00:00'),
(1, 3, '08:00:00', '12:00:00'),
(2, 2, '13:00:00', '17:00:00'),
(3, 4, '09:00:00', '13:00:00'),
(4, 5, '08:00:00', '12:00:00'),
(5, 1, '13:00:00', '17:00:00');

INSERT INTO pacientes (nombre, apellido, fecha_nacimiento, genero, telefono, email, direccion) VALUES
('José', 'Hernández', '1990-05-14', 'M', '6111-1111', 'jose.hernandez@mail.com', 'Ciudad de Panamá'),
('María', 'López', '1985-08-22', 'F', '6222-2222', 'maria.lopez@mail.com', 'San Miguelito'),
('Pedro', 'Castillo', '2015-01-10', 'M', '6333-3333', 'pedro.castillo@mail.com', 'Panamá Oeste'),
('Laura', 'Jiménez', '1998-11-30', 'F', '6444-4444', 'laura.jimenez@mail.com', 'Arraiján'),
('Diego', 'Vargas', '1975-03-03', 'M', '6555-5555', 'diego.vargas@mail.com', 'Chorrera');

INSERT INTO citas (id_paciente, id_medico, id_consultorio, fecha, hora, motivo, estado) VALUES
(1, 1, 1, '2026-08-17', '08:30:00', 'Chequeo general', 'Programada'),
(2, 3, 3, '2026-08-18', '09:00:00', 'Dolor de pecho', 'Confirmada'),
(3, 2, 2, '2026-08-19', '10:00:00', 'Control de crecimiento', 'Programada'),
(4, 4, 3, '2026-08-19', '13:30:00', 'Revisión de lunar', 'Atendida'),
(5, 1, 1, '2026-08-20', '09:00:00', 'Dolor de espalda', 'Cancelada');

INSERT INTO diagnosticos (id_cita, descripcion, tratamiento, observaciones) VALUES
(4, 'Lunar benigno, sin signos de malignidad', 'Ninguno, control anual', 'Paciente informado de señales de alarma');

-- =====================================================================
-- FIN DEL SCRIPT
-- =====================================================================
