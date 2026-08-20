# API REST - Sistema de Gestión de Citas Médicas

## Instalación

```bash
cd api
npm install
cp .env.example .env   # editar con tus credenciales de MariaDB
npm run dev             # o: npm start
```

Antes de levantar la API, importa `database/01_schema.sql` en tu servidor MariaDB.

## Endpoints

### Especialidades — `/api/especialidades`
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/especialidades` | Listar todas |
| GET | `/api/especialidades/:id` | Obtener una |
| POST | `/api/especialidades` | Crear |
| PUT | `/api/especialidades/:id` | Actualizar |
| DELETE | `/api/especialidades/:id` | Eliminar |

### Consultorios — `/api/consultorios`
Mismo patrón CRUD que especialidades.

### Médicos — `/api/medicos`
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/medicos` | Listar todos |
| GET | `/api/medicos/estadisticas` | **Consulta cruda** sobre `vista_estadisticas_medico` (total de citas, atendidas, canceladas, inasistencias por médico) |
| GET | `/api/medicos/:id` | Obtener uno |
| POST | `/api/medicos` | Crear |
| PUT | `/api/medicos/:id` | Actualizar |
| DELETE | `/api/medicos/:id` | Eliminar |

### Pacientes — `/api/pacientes`
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/pacientes` | Listar todos |
| GET | `/api/pacientes/:id` | Obtener uno |
| GET | `/api/pacientes/:id/historial` | **Procedimiento almacenado** `sp_historial_paciente`: citas + diagnósticos del paciente |
| POST | `/api/pacientes` | Crear |
| PUT | `/api/pacientes/:id` | Actualizar |
| DELETE | `/api/pacientes/:id` | Eliminar |

### Citas — `/api/citas`
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/citas` | Listar todas |
| GET | `/api/citas/completas?fecha=2026-08-18&estado=Confirmada` | **Consulta cruda** sobre `vista_citas_completas`, con filtros opcionales |
| POST | `/api/citas/agendar` | **Procedimiento almacenado** `sp_agendar_cita`: valida choque de horario antes de crear |
| GET | `/api/citas/:id` | Obtener una |
| POST | `/api/citas` | Crear (sin validación de choque, vía ORM) |
| PUT | `/api/citas/:id` | Actualizar |
| DELETE | `/api/citas/:id` | Eliminar |

### Diagnósticos — `/api/diagnosticos`
Mismo patrón CRUD que especialidades.

## Ejemplo: agendar una cita (usa el SP)

```bash
curl -X POST http://localhost:3000/api/citas/agendar \
  -H "Content-Type: application/json" \
  -d '{
    "id_paciente": 1,
    "id_medico": 2,
    "id_consultorio": 2,
    "fecha": "2026-08-25",
    "hora": "10:00:00",
    "motivo": "Consulta de control"
  }'
```

## Formato de respuesta estándar

```json
{ "status": "success", "data": { ... } }
{ "status": "error", "message": "..." }
```

Códigos HTTP usados: `200` OK, `201` Creado, `204` Eliminado sin contenido, `400` Solicitud inválida,
`404` No encontrado, `409` Conflicto (choque de horario / referencia inválida), `500` Error del servidor.
