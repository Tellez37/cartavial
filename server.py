import http.server
import json
import os
import socketserver
import time
from urllib.parse import urlparse

PORT = 8090
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data", "incidentes.json")
# Tiempo de expiración automática: 2 horas (7200 segundos)
EXPIRATION_SECONDS = 2 * 60 * 60


def read_incidents():
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            items = json.load(f)
        now_ms = int(time.time() * 1000)
        # Filtrar automáticamente reportes con más de 2 horas de antigüedad
        valid_items = [
            i for i in items
            if not i.get("createdAt") or (now_ms - int(i["createdAt"])) <= (EXPIRATION_SECONDS * 1000)
        ]
        if len(valid_items) != len(items):
            write_incidents(valid_items)
        return valid_items
    except Exception:
        return []


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
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_GET(self):
        if "If-Modified-Since" in self.headers:
            del self.headers["If-Modified-Since"]
        if "If-None-Match" in self.headers:
            del self.headers["If-None-Match"]
        parsed = urlparse(self.path)
        if parsed.path == "/data/incidentes.json":
            items = read_incidents()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(items, ensure_ascii=False).encode("utf-8"))
            return
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
                if "createdAt" not in new_item:
                    new_item["createdAt"] = int(time.time() * 1000)
                items = read_incidents()
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

        if parsed.path == "/api/delete":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8")
            try:
                payload = json.loads(body)
                target_id = payload.get("id")
                items = [i for i in read_incidents() if i.get("id") != target_id]
                write_incidents(items)
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"ok": True}).encode("utf-8"))
            except Exception as e:
                self.send_response(400)
                self.end_headers()
            return

        if parsed.path == "/api/reset":
            write_incidents([])
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
