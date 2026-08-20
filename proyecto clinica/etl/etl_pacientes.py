"""
ETL - Carga de pacientes desde un sistema externo
===================================================
Sistema de Gestión de Citas Médicas - Proyecto Final Base de Datos II

Flujo:
  1. EXTRACT   -> Lee el CSV crudo que llega de un sistema externo (ej. formulario
                  de preregistro web, otra clínica, un Excel exportado, etc.)
  2. TRANSFORM -> Limpia espacios, normaliza texto, unifica formatos de fecha y
                  género, valida correos, y descarta/reporta filas inválidas.
  3. LOAD      -> Inserta los registros limpios en la tabla `pacientes` de MariaDB,
                  evitando duplicados por email (INSERT ... ON DUPLICATE KEY UPDATE).

Cómo correrlo:
  python etl_pacientes.py

Requiere un archivo .env en esta misma carpeta (ver .env.example) con las
credenciales de conexión a MariaDB.
"""

import csv
import logging
import os
import re
import sys
from datetime import datetime

import mysql.connector
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Configuración
# ---------------------------------------------------------------------------
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_CSV = os.path.join(BASE_DIR, "data", "pacientes_externos.csv")
LOG_DIR = os.path.join(BASE_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)

REJECTED_CSV = os.path.join(LOG_DIR, "pacientes_rechazados.csv")
LOG_FILE = os.path.join(LOG_DIR, f"etl_{datetime.now():%Y%m%d_%H%M%S}.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler(LOG_FILE, encoding="utf-8"), logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("ETL-Pacientes")

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# Distintos formatos de fecha que podrían llegar del sistema externo
DATE_FORMATS = ["%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d"]

GENERO_MAP = {
    "m": "M", "masculino": "M",
    "f": "F", "femenino": "F",
    "otro": "Otro",
}


# ---------------------------------------------------------------------------
# 1. EXTRACT
# ---------------------------------------------------------------------------
def extraer(ruta_csv):
    log.info(f"EXTRACT: leyendo archivo fuente '{ruta_csv}'")
    with open(ruta_csv, encoding="utf-8") as f:
        filas = list(csv.DictReader(f))
    log.info(f"EXTRACT: {len(filas)} filas leídas del origen")
    return filas


# ---------------------------------------------------------------------------
# 2. TRANSFORM
# ---------------------------------------------------------------------------
def limpiar_texto(valor):
    return " ".join(valor.strip().split()) if valor else ""


def normalizar_telefono(valor):
    # Deja solo dígitos y guiones, en formato 0000-0000
    digitos = re.sub(r"\D", "", valor or "")
    if len(digitos) == 8:
        return f"{digitos[:4]}-{digitos[4:]}"
    return valor.strip() if valor else None


def parsear_fecha(valor):
    valor = (valor or "").strip()
    for formato in DATE_FORMATS:
        try:
            fecha = datetime.strptime(valor, formato)
            # Descarta fechas imposibles (ej. 31/02) o futuras
            if fecha > datetime.now():
                return None
            return fecha.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def transformar(filas_crudas):
    log.info("TRANSFORM: limpiando y validando registros")
    limpios = []
    rechazados = []
    vistos_email = set()

    for i, fila in enumerate(filas_crudas, start=1):
        nombre_completo = limpiar_texto(fila.get("nombre_completo", ""))
        email = limpiar_texto(fila.get("correo", "")).lower()
        genero_raw = limpiar_texto(fila.get("genero", "")).lower()
        fecha_nac = parsear_fecha(fila.get("fecha_nacimiento", ""))
        telefono = normalizar_telefono(fila.get("telefono", ""))
        direccion = limpiar_texto(fila.get("direccion", ""))

        motivo_rechazo = None
        if not nombre_completo:
            motivo_rechazo = "Nombre vacío"
        elif not EMAIL_REGEX.match(email):
            motivo_rechazo = "Email con formato inválido"
        elif genero_raw not in GENERO_MAP:
            motivo_rechazo = f"Género no reconocido: '{fila.get('genero')}'"
        elif fecha_nac is None:
            motivo_rechazo = f"Fecha de nacimiento inválida: '{fila.get('fecha_nacimiento')}'"
        elif email in vistos_email:
            motivo_rechazo = "Email duplicado dentro del mismo archivo"

        if motivo_rechazo:
            rechazados.append({**fila, "motivo_rechazo": motivo_rechazo})
            log.warning(f"Fila {i} rechazada: {motivo_rechazo} -> {fila}")
            continue

        vistos_email.add(email)

        # nombre_completo -> nombre / apellido (se asume: primer token = nombre,
        # resto = apellido; ajustar si el sistema origen separa distinto)
        partes = nombre_completo.title().split(" ", 1)
        nombre = partes[0]
        apellido = partes[1] if len(partes) > 1 else ""

        limpios.append({
            "nombre": nombre,
            "apellido": apellido,
            "fecha_nacimiento": fecha_nac,
            "genero": GENERO_MAP[genero_raw],
            "telefono": telefono,
            "email": email,
            "direccion": direccion,
        })

    log.info(f"TRANSFORM: {len(limpios)} registros válidos, {len(rechazados)} rechazados")

    if rechazados:
        with open(REJECTED_CSV, "w", newline="", encoding="utf-8") as f:
            campos = list(rechazados[0].keys())
            writer = csv.DictWriter(f, fieldnames=campos)
            writer.writeheader()
            writer.writerows(rechazados)
        log.info(f"TRANSFORM: detalle de rechazados guardado en '{REJECTED_CSV}'")

    return limpios


# ---------------------------------------------------------------------------
# 3. LOAD
# ---------------------------------------------------------------------------
def cargar(registros):
    if not registros:
        log.info("LOAD: no hay registros válidos para cargar")
        return

    log.info(f"LOAD: conectando a MariaDB en {os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}")
    conexion = mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "clinica_citas"),
        charset="utf8mb4",
    )
    cursor = conexion.cursor()

    # ON DUPLICATE KEY UPDATE evita romper por el índice único de email;
    # si el paciente ya existe, simplemente actualiza sus datos (idempotente:
    # el ETL se puede re-ejecutar sin duplicar pacientes).
    sql = """
        INSERT INTO pacientes (nombre, apellido, fecha_nacimiento, genero, telefono, email, direccion)
        VALUES (%(nombre)s, %(apellido)s, %(fecha_nacimiento)s, %(genero)s, %(telefono)s, %(email)s, %(direccion)s)
        ON DUPLICATE KEY UPDATE
            nombre = VALUES(nombre),
            apellido = VALUES(apellido),
            fecha_nacimiento = VALUES(fecha_nacimiento),
            genero = VALUES(genero),
            telefono = VALUES(telefono),
            direccion = VALUES(direccion)
    """

    insertados = 0
    for registro in registros:
        try:
            cursor.execute(sql, registro)
            insertados += 1
        except mysql.connector.Error as err:
            log.error(f"LOAD: error insertando {registro['email']}: {err}")

    conexion.commit()
    log.info(f"LOAD: {insertados} registros insertados/actualizados en 'pacientes'")

    cursor.close()
    conexion.close()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    log.info("===== INICIO DEL PROCESO ETL =====")
    crudos = extraer(INPUT_CSV)
    limpios = transformar(crudos)
    cargar(limpios)
    log.info("===== FIN DEL PROCESO ETL =====")


if __name__ == "__main__":
    main()
