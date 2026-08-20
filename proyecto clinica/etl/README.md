# ETL - Carga de Pacientes desde Sistema Externo

## ¿Qué hace este ETL?

Simula la llegada de un archivo de pacientes desde un sistema externo (por ejemplo,
un formulario web de preregistro, u otra clínica que exporta sus datos). Ese tipo
de archivos casi siempre llegan "sucios": con espacios de más, mayúsculas/minúsculas
mezcladas, distintos formatos de fecha, teléfonos mal escritos, correos inválidos y
registros duplicados. Este script los deja listos para vivir en la base de datos.

```
data/pacientes_externos.csv   ──▶  EXTRACT  ──▶  TRANSFORM  ──▶  LOAD  ──▶  tabla `pacientes`
                                                       │
                                                       ▼
                                          logs/pacientes_rechazados.csv
                                          (registros inválidos, con el motivo)
```

## 1. Extract
Lee el CSV de origen tal cual llega (`data/pacientes_externos.csv`). En un
escenario real, este archivo podría venir de un SFTP, un correo, o la
exportación de otro sistema — el resto del proceso no cambia.

## 2. Transform
Por cada fila:
- Quita espacios extra y normaliza mayúsculas/minúsculas en los nombres.
- Convierte cualquier formato de fecha reconocido (`dd/mm/aaaa`, `aaaa-mm-dd`,
  `dd-mm-aaaa`, `aaaa/mm/dd`) a un único formato estándar (`aaaa-mm-dd`).
- Unifica el género a `M`, `F` u `Otro` sin importar cómo vino escrito
  (`masculino`, `m`, `Femenino`, etc.).
- Normaliza el teléfono al formato `0000-0000`.
- Valida que el correo tenga formato válido.
- Descarta filas con nombre vacío, correo inválido, género no reconocido,
  fecha inválida (ej. `31/02/1995`, que no existe), o correo duplicado dentro
  del mismo archivo.
- Todo lo rechazado se guarda con su motivo en `logs/pacientes_rechazados.csv`,
  para que puedas revisarlo y corregirlo en el origen si hace falta.

## 3. Load
Inserta los registros limpios en la tabla `pacientes`. Usa
`INSERT ... ON DUPLICATE KEY UPDATE` sobre el email (que es único en la
tabla), así que **el script se puede correr varias veces sin duplicar
pacientes** — si el paciente ya existe, simplemente actualiza sus datos.

## Instalación y ejecución

```bash
cd etl
pip install -r requirements.txt --break-system-packages   # o sin esa bandera fuera de Linux
cp .env.example .env     # edita con tus credenciales de MariaDB
python etl_pacientes.py
```

Cada corrida genera un log con timestamp en `logs/etl_AAAAMMDD_HHMMSS.log` con
el detalle completo del proceso (filas leídas, aceptadas, rechazadas y cargadas).

## Automatización

Para que corra solo sin intervención manual:

- **Windows**: usa el Programador de tareas (Task Scheduler) → crear tarea
  básica → acción "Iniciar un programa" → programa `python`, argumentos
  `etl_pacientes.py`, "Iniciar en" la carpeta `etl`.
- **Linux/Mac**: agrega una entrada de `cron`, por ejemplo para correr todos
  los días a las 2 a.m.:
  ```
  0 2 * * * cd /ruta/al/proyecto/etl && /usr/bin/python3 etl_pacientes.py
  ```

## Para usar tu propio archivo de origen

Reemplaza `data/pacientes_externos.csv` por el archivo real (mismas columnas:
`nombre_completo, fecha_nacimiento, genero, telefono, correo, direccion`), o
cambia la constante `INPUT_CSV` en `etl_pacientes.py` para apuntar a otra ruta.

## Prueba ya verificada

Este ETL fue probado en un entorno real: de 10 filas de entrada "sucias",
rechazó correctamente las 3 inválidas (un duplicado, un email sin `@`, y un
nombre vacío) y cargó las 7 restantes ya limpias y normalizadas a MariaDB.
