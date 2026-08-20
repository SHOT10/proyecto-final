# Guía rápida: levantar y probar el proyecto en VS Code

## 1. Requisitos previos
- **Node.js 18+** instalado (`node -v` para verificar).
- **MariaDB** instalado y corriendo localmente (o vía XAMPP/Docker).
- VS Code con la extensión **REST Client** (`humao.rest-client`) — para probar
  desde `pruebas.http` sin salir del editor.
- Opcional: **Postman** para las pruebas funcionales formales que pide el proyecto.

## 2. Abrir el proyecto en VS Code
Abre la carpeta `proyecto_clinica` completa en VS Code (File > Open Folder).
Verás:
```
proyecto_clinica/
├── database/01_schema.sql        <- Fase 1
├── api/                          <- Fase 2 (esta guía)
│   ├── src/
│   ├── pruebas.http
│   ├── .env.example
│   └── README.md
└── postman/
    └── Clinica_Citas_API.postman_collection.json
```

## 3. Cargar la base de datos
Abre una terminal en VS Code (Ctrl+ñ / Cmd+`) y ejecuta:
```bash
mysql -u root -p < database/01_schema.sql
```
Esto crea la base `clinica_citas` con tablas, vistas, procedimientos y datos de prueba.

## 4. Configurar la API
```bash
cd api
npm install
cp .env.example .env
```
Edita `.env` con tu usuario/contraseña real de MariaDB:
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=clinica_citas
DB_USER=root
DB_PASSWORD=tu_password
```

## 5. Levantar la API
```bash
npm run dev
```
Deberías ver:
```
✅ Conexión a MariaDB establecida correctamente.
🚀 API corriendo en http://localhost:3000
```
Si ves un error de conexión, revisa que MariaDB esté corriendo y que las
credenciales del `.env` sean correctas.

## 6. Probar desde VS Code (rápido, sin Postman)
Abre `api/pruebas.http`. Encima de cada bloque `###` aparecerá un enlace
**"Send Request"** — haz clic y la respuesta se abre en un panel al lado.
Es la forma más rápida de ir probando mientras programas.

## 7. Probar con Postman (pruebas funcionales formales)
1. Abre Postman → Import → selecciona `postman/Clinica_Citas_API.postman_collection.json`.
2. La colección ya trae la variable `base_url = http://localhost:3000/api`.
3. Corre cada carpeta (Especialidades, Médicos, Pacientes, Citas, Diagnósticos)
   o usa el botón "Run collection" para correr todo de una vez y generar el
   reporte de resultados que puedes anexar a la documentación (Fase 5 del proyecto).

## 8. Casos ya verificados en este entorno
Antes de entregarte el proyecto, corrí toda la API contra una MariaDB real y confirmé:
- CRUD completo de las 6 entidades responde con los códigos HTTP correctos.
- `GET /api/citas/completas` y `GET /api/medicos/estadisticas` devuelven los
  datos de las vistas, con acentos correctos (UTF-8).
- `POST /api/citas/agendar` crea la cita cuando el horario está libre (201) y
  responde **409** cuando el médico ya tiene una cita en ese horario (prueba
  real de que el procedimiento almacenado `sp_agendar_cita` funciona).
- `GET /api/pacientes/:id/historial` devuelve correctamente 1 o varias citas
  con su diagnóstico (procedimiento `sp_historial_paciente`).

## 9. Siguientes fases (cuando quieras seguir)
- **ETL**: script para cargar datos externos (ej. CSV de pacientes) a la BD.
- **Dashboard**: conexión de Power BI/Tableau a `vista_citas_completas` y
  `vista_estadisticas_medico`.
- **JMeter**: plan de pruebas de carga sobre estos mismos endpoints.
- **Documentación**: DER, manual paso a paso, glosario, lecciones aprendidas.
