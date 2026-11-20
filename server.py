import http.server
import json
import os
import socketserver
from urllib.parse import urlparse

PORT = 8090
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data", "incidentes.json")

INITIAL_INCIDENTS = [
    {
        "id": "ctg-001",
        "tipo": "Choque",
        "sector": "Av. Pedro de Heredia - Mercado de Bazurto",
        "mapsUrl": "https://www.google.com/maps?q=10.4136,-75.5219",
        "lat": 10.4136,
        "lng": -75.5219,
        "fecha": "Hace 12 min",
        "fuente": "Reporte ciudadano"
    },
    {
        "id": "ctg-002",
        "tipo": "Semáforo dañado",
        "sector": "Bomba El Amparo - Cruce Ronda Real",
        "mapsUrl": "https://www.google.com/maps?q=10.3912,-75.4795",
        "lat": 10.3912,
        "lng": -75.4795,
        "fecha": "Hace 25 min",
        "fuente": "Reporte ciudadano"
    },
    {
        "id": "ctg-003",
        "tipo": "Vía cerrada",
        "sector": "Vía Mamonal Km 4 - Puerta de Hierro",
        "mapsUrl": "https://www.google.com/maps?q=10.3548,-75.4981",
        "lat": 10.3548,
        "lng": -75.4981,
        "fecha": "Hace 38 min",
        "fuente": "Reporte ciudadano"
    },
    {
        "id": "ctg-004",
        "tipo": "Choque",
        "sector": "Pie de la Popa - Estación Lo Amador (Av. Pedro de Heredia)",
        "mapsUrl": "https://www.google.com/maps?q=10.4208,-75.5342",
        "lat": 10.4208,
        "lng": -75.5342,
        "fecha": "Hace 45 min",
        "fuente": "Reporte ciudadano"
    },
    {
        "id": "ctg-005",
        "tipo": "Semáforo dañado",
        "sector": "Av. Crisanto Luque - Diagonal 21 (El Bosque)",
        "mapsUrl": "https://www.google.com/maps?q=10.3965,-75.5158",
        "lat": 10.3965,
        "lng": -75.5158,
        "fecha": "Hace 1 hora",
        "fuente": "Reporte ciudadano"
    },
    {
        "id": "ctg-006",
        "tipo": "Vía cerrada",
        "sector": "Centro / Getsemaní - Calle Media Luna",
        "mapsUrl": "https://www.google.com/maps?q=10.4225,-75.5441",
        "lat": 10.4225,
        "lng": -75.5441,
        "fecha": "Hace 1 hora",
        "fuente": "Reporte ciudadano"
    }
]


def read_incidents():
    if not os.path.exists(DATA_FILE):
        return list(INITIAL_INCIDENTS)
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return list(INITIAL_INCIDENTS)


def write_incidents(items):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)


class CartaVialHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_GET(self):
        # Eliminar cabeceras de caché del navegador para nunca devolver 304 Not Modified
        if "If-Modified-Since" in self.headers:
            del self.headers["If-Modified-Since"]
        if "If-None-Match" in self.headers:
            del self.headers["If-None-Match"]
        super().do_GET()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/incidentes":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8")
            try:
                new_item = json.loads(body)
                items = read_incidents()
                # Evitar duplicados si se reenvía el mismo id
                existing_ids = {i.get("id") for i in items if i.get("id")}
                if new_item.get("id") not in existing_ids:
                    items.insert(0, new_item)
                    write_incidents(items)

                self.send_response(201)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"ok": True, "total": len(items)}).encode("utf-8"))
            except Exception as e:
                self.send_response(400)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"ok": False, "error": str(e)}).encode("utf-8"))
            return

        if parsed.path == "/api/reset":
            write_incidents(INITIAL_INCIDENTS)
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": True}).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("0.0.0.0", PORT), CartaVialHandler) as httpd:
        print(f"Servidor CartaVial activo en http://0.0.0.0:{PORT}")
        httpd.serve_forever()
