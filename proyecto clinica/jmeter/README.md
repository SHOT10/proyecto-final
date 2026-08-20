# Pruebas de Carga y Rendimiento - JMeter

## ¿Qué incluye este plan de pruebas?

`plan_pruebas_clinica.jmx` define 2 grupos de carga sobre tu API:

| Grupo | Qué prueba | Carga |
|---|---|---|
| **Grupo 1 - Lecturas Generales** | `/health`, `/especialidades`, `/medicos`, `/medicos/estadisticas` (vista), `/pacientes`, `/citas/completas` (vista) | 50 usuarios concurrentes, 10 repeticiones cada uno (500 peticiones por endpoint) |
| **Grupo 2 - Historial de Paciente** | `/pacientes/{id}/historial` (procedimiento almacenado), usando 5 IDs de `ids_pacientes.csv` en rotación | 20 usuarios concurrentes, 20 repeticiones cada uno |

Incluye un **Summary Report** y un **Aggregate Report** como listeners, que son los
que necesitas para el entregable de "reportes que evidencien los resultados".

## Requisitos previos

1. Descarga JMeter (gratis) desde **jmeter.apache.org/download_jmeter.cgi** — elige
   el "Binaries" `.zip`. No necesita instalación, solo descomprimir.
2. Necesitas tener **Java** instalado (JMeter corre sobre Java). Verifica con
   `java -version` en tu terminal; si no lo tienes, descárgalo de adoptium.net.
3. Tu API debe estar corriendo (`npm run dev` en la carpeta `api`) antes de
   lanzar las pruebas.

## Cómo correrlo (interfaz gráfica)

1. Descomprime JMeter y abre la carpeta `bin`.
2. Ejecuta `jmeter.bat` (Windows) o `jmeter.sh` (Mac/Linux).
3. En JMeter, ve a **File > Open** y selecciona `plan_pruebas_clinica.jmx`
   (el que está en esta carpeta).
4. **Importante**: antes de correrlo, haz clic en el elemento "IDs de pacientes
   de prueba" (CSV Data Set Config) dentro del Grupo 2, y en el campo
   "Filename" pon la ruta completa a `ids_pacientes.csv` en tu computadora
   (o simplemente copia ambos archivos, el `.jmx` y el `.csv`, a la misma
   carpeta — así JMeter lo encuentra solo con el nombre relativo).
5. Dale clic al botón verde ▶ (Start) en la barra superior.
6. Mientras corre, haz doble clic en "Summary Report" o "Aggregate Report" en
   el árbol de la izquierda para ver los resultados en tiempo real: tiempo de
   respuesta promedio, mínimo, máximo, percentil 90, throughput y % de error.

## Cómo correrlo desde la terminal (recomendado para el reporte final)

JMeter genera un dashboard HTML mucho más completo en modo consola. Desde la
carpeta `bin` de JMeter:

```bash
jmeter -n -t "ruta\a\plan_pruebas_clinica.jmx" -l resultados\resultado.jtl -e -o resultados\dashboard
```

- `-n` corre en modo no-gráfico (más rápido y realista para medir rendimiento real)
- `-l` guarda los resultados crudos
- `-e -o` genera un dashboard HTML completo en la carpeta `resultados/dashboard`

Al terminar, abre `resultados/dashboard/index.html` en tu navegador — ese
dashboard (con gráficos de tiempos de respuesta, throughput, códigos de
respuesta, etc.) es justo lo que quieres anexar como "reporte de pruebas de
rendimiento" en tu documentación.

## Qué mirar en los resultados

- **% Error**: debería ser 0% si tu API está saludable. Si ves errores, revisa
  que la API y MariaDB sigan corriendo durante toda la prueba.
- **Tiempo de respuesta promedio**: para una API local con MariaDB, se espera
  que esté en el rango de milisegundos (decenas, no segundos).
- **Throughput**: peticiones por segundo que tu API logra sostener.
- Compara el Grupo 1 (lecturas simples) vs. Grupo 2 (usa un procedimiento
  almacenado) — es interesante para tu documentación mostrar si hay una
  diferencia notable de rendimiento entre ambos.
