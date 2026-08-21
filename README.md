# Sistema de Gestión de Citas Médicas

Proyecto final del curso **Base de Datos II** — Universidad Interamericana de Panamá.

Sistema completo de gestión de citas para una clínica con múltiples especialidades: modelo relacional en 3FN, API REST, proceso ETL de carga de pacientes, dashboard en Power BI y pruebas funcionales y de rendimiento.

**Autor:** Ariel Torralbo
**Profesor:** Maryon José Torres Rodríguez

---

## 📋 Descripción

El sistema cubre el ciclo de vida completo de una solución de datos para la operación de una clínica: registro de pacientes, médicos, consultorios y especialidades; agendamiento de citas con validación de choque de horario; registro de diagnósticos; carga de pacientes externos vía ETL; y visualización de indicadores en un dashboard.

## 🛠️ Tecnologías utilizadas

| Componente | Tecnología |
|---|---|
| Base de datos | MariaDB 12.3 |
| Backend / API | Node.js, Express, Sequelize, mysql2 |
| ETL | Python 3.12, mysql-connector-python, python-dotenv |
| Visualización | Power BI Desktop |
| Pruebas funcionales | Postman / REST Client (VS Code) |
| Pruebas de rendimiento | Apache JMeter 5.6.3 |

## 📁 Estructura del repositorio

```
proyecto clinica/
├── api/              # API REST (Node.js + Express + Sequelize)
├── database/         # Esquema SQL, vistas y procedimientos almacenados
├── etl/               # Script Python de carga y limpieza de pacientes
├── jmeter/            # Plan de pruebas de rendimiento y resultados
├── postman/           # Colección de pruebas funcionales
└── README.md
```

## 🗄️ Modelo de datos

Modelo relacional en **Tercera Forma Normal (3FN)** con siete entidades: `especialidades`, `medicos`, `pacientes`, `consultorios`, `horarios_medicos`, `citas` y `diagnosticos`.

- **1 especialidad → N médicos**
- **1 médico → N horarios / N citas**
- **1 consultorio → N citas**
- **1 paciente → N citas**
- **1 cita → 1 diagnóstico** (relación 1 a 1, forzada con `UNIQUE`)

### Vistas
- `vista_citas_completas`: detalle completo de cada cita (paciente, médico, especialidad, consultorio)
- `vista_estadisticas_medico`: desempeño por médico (citas totales, atendidas, canceladas, inasistencias)

### Procedimientos almacenados
- `sp_agendar_cita`: agenda una cita validando que el médico no tenga otra activa en el mismo horario
- `sp_historial_paciente`: devuelve el historial completo de citas y diagnósticos de un paciente

## 🔌 Endpoints principales de la API

| Recurso | Rutas |
|---|---|
| Especialidades | `GET/POST /api/especialidades`, `GET/PUT/DELETE /api/especialidades/:id` |
| Médicos | `GET/POST /api/medicos`, `GET /api/medicos/estadisticas`, `GET/PUT/DELETE /api/medicos/:id` |
| Pacientes | `GET/POST /api/pacientes`, `GET /api/pacientes/:id/historial`, `GET/PUT/DELETE /api/pacientes/:id` |
| Citas | `GET /api/citas`, `GET /api/citas/completas`, `POST /api/citas/agendar`, `GET/PUT/DELETE /api/citas/:id` |
| Diagnósticos | `GET/POST /api/diagnosticos` |

Respuestas estándar: `{ "status": "success", "data": {...} }` o `{ "status": "error", "message": "..." }`.

## 🚀 Instalación y ejecución

### 1. Base de datos (MariaDB)

```powershell
Get-Content database\01_schema.sql | & "C:\Program Files\MariaDB 12.3\bin\mysql.exe" -u root -p
```

### 2. API REST

```bash
cd api
copy .env.example .env    # completar con las credenciales reales de MariaDB
npm install
npm run dev                # o: npm start
```

La API queda disponible en `http://localhost:3000`.

### 3. Pruebas funcionales

Con la API corriendo, ejecutar las peticiones del archivo `pruebas.http` (REST Client de VS Code) o importar la colección de Postman en `postman/`.

### 4. ETL de pacientes

```bash
cd etl
copy .env.example .env    # completar con las credenciales de MariaDB
python -m pip install -r requirements.txt
python etl_pacientes.py
```

El proceso lee `data/pacientes_externos.csv`, limpia y valida los datos, y los carga en la tabla `pacientes` de forma idempotente (`INSERT ... ON DUPLICATE KEY UPDATE`). Los registros rechazados y su motivo quedan en `logs/pacientes_rechazados.csv`.

### 5. Dashboard en Power BI

Conectar Power BI Desktop a MariaDB (`Obtener datos → Base de datos MySQL`) sobre la base `clinica_citas`, e importar las vistas `vista_citas_completas` y `vista_estadisticas_medico`.

### 6. Pruebas de carga (JMeter)

Con la API corriendo, ejecutar el plan de pruebas de `jmeter/` (20 usuarios simulados, ramp-up 10s, 5 loops) contra 6 endpoints representativos. Resultados obtenidos: **0% de error**, tiempo promedio de 3 ms, p99 de 19 ms, throughput de 7.3 peticiones/segundo.

## ⚙️ Variables de entorno

Tanto `api/` como `etl/` requieren un archivo `.env` (no versionado) basado en el `.env.example` correspondiente, con las credenciales de conexión a MariaDB.

