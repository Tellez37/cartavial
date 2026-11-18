/**
 * CartaVial — Inteligencia ciudadana para movernos mejor en Cartagena
 * MVP: OpenStreetMap + Leaflet + Google Forms + Google Sheets (JSON público)
 */

// ============================================================================
// 1. CONFIGURACIÓN PRINCIPAL (Puedes pegar aquí tus links antes de subir a GitHub Pages)
// ============================================================================
const DEFAULT_CONFIG = {
  // Pega aquí el link o ID de tu Google Sheet público cuando lo crees:
  // Ejemplo: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
  googleSheetUrl: "",

  // Pega aquí el link de tu Google Form (o Web App de Google Apps Script):
  // Ejemplo: "https://docs.google.com/forms/d/e/1FAIpQLSe.../viewform"
  googleFormUrl: "",

  // Coordenadas centrales de Cartagena de Indias
  cartagenaCenter: [10.4025, -75.5140],
  defaultZoom: 13
};

// ============================================================================
// 2. DICCIONARIO GEORREFERENCIADO DE SECTORES Y VÍAS DE CARTAGENA
// Respaldo inteligente cuando un usuario pega un link acortado (maps.app.goo.gl)
// ============================================================================
const SECTORES_CARTAGENA = [
  { keywords: ["bazurto", "mercado"], lat: 10.4136, lng: -75.5219 },
  { keywords: ["pie de la popa", "lo amador", "popa"], lat: 10.4208, lng: -75.5342 },
  { keywords: ["amparo", "ronda real", "bomba el amparo"], lat: 10.3912, lng: -75.4795 },
  { keywords: ["mamonal", "puerta de hierro", "zona industrial"], lat: 10.3548, lng: -75.4981 },
  { keywords: ["ceballos", "nuevo bosque"], lat: 10.3822, lng: -75.5055 },
  { keywords: ["bosque", "crisanto luque"], lat: 10.3965, lng: -75.5158 },
  { keywords: ["cuatro vientos", "4 vientos"], lat: 10.4079, lng: -75.5061 },
  { keywords: ["maria auxiliadora", "maría auxiliadora", "espana", "españa"], lat: 10.4112, lng: -75.5145 },
  { keywords: ["villa olimpica", "villa olímpica", "ejecutivos", "chambacu"], lat: 10.4038, lng: -75.4968 },
  { keywords: ["castellana", "alpes", "los alpes"], lat: 10.3962, lng: -75.4852 },
  { keywords: ["centro", "reloj", "matuna", "india catalina", "chambacú"], lat: 10.4245, lng: -75.5468 },
  { keywords: ["getsemani", "getsemaní", "media luna", "puente roman", "puente román"], lat: 10.4218, lng: -75.5438 },
  { keywords: ["manga", "jimenez", "jiménez"], lat: 10.4125, lng: -75.5365 },
  { keywords: ["bocagrande", "san martin", "san martín", "castillogrande", "laguito"], lat: 10.4021, lng: -75.5542 },
  { keywords: ["crespo", "tunel", "túnel", "aeropuerto", "marbella", "cabrero"], lat: 10.4438, lng: -75.5182 },
  { keywords: ["torices", "paseo de bolivar", "paseo de bolívar", "santa rita"], lat: 10.4315, lng: -75.5318 },
  { keywords: ["transversal 54", "country", "corales", "blas de lezo", "caracoles"], lat: 10.3865, lng: -75.4932 },
  { keywords: ["pozon", "pozón", "cordialidad", "terminal"], lat: 10.4018, lng: -75.4485 },
  { keywords: ["terwengel", "ternera", "san jose", "san josé", "universidad"], lat: 10.3812, lng: -75.4685 },
  { keywords: ["pedro de heredia"], lat: 10.4095, lng: -75.5105 }
];

// Datos semilla de Cartagena por si se abre directamente sin servidor local (file://)
const FALLBACK_INCIDENTS = [
  {
    id: "ctg-001",
    tipo: "Choque",
    sector: "Av. Pedro de Heredia - Mercado de Bazurto",
    mapsUrl: "https://www.google.com/maps?q=10.4136,-75.5219",
    lat: 10.4136,
    lng: -75.5219,
    fecha: "Hace 12 min",
    fuente: "Reporte ciudadano"
  },
  {
    id: "ctg-002",
    tipo: "Semáforo dañado",
    sector: "Bomba El Amparo - Cruce Ronda Real",
    mapsUrl: "https://www.google.com/maps?q=10.3912,-75.4795",
    lat: 10.3912,
    lng: -75.4795,
    fecha: "Hace 25 min",
    fuente: "Reporte ciudadano"
  },
  {
    id: "ctg-003",
    tipo: "Vía cerrada",
    sector: "Vía Mamonal Km 4 - Puerta de Hierro",
    mapsUrl: "https://www.google.com/maps?q=10.3548,-75.4981",
    lat: 10.3548,
    lng: -75.4981,
    fecha: "Hace 38 min",
    fuente: "Reporte ciudadano"
  },
  {
    id: "ctg-004",
    tipo: "Choque",
    sector: "Pie de la Popa - Estación Lo Amador (Av. Pedro de Heredia)",
    mapsUrl: "https://www.google.com/maps?q=10.4208,-75.5342",
    lat: 10.4208,
    lng: -75.5342,
    fecha: "Hace 45 min",
    fuente: "Reporte ciudadano"
  },
  {
    id: "ctg-005",
    tipo: "Semáforo dañado",
    sector: "Av. Crisanto Luque - Diagonal 21 (El Bosque)",
    mapsUrl: "https://www.google.com/maps?q=10.3965,-75.5158",
    lat: 10.3965,
    lng: -75.5158,
    fecha: "Hace 1 hora",
    fuente: "Reporte ciudadano"
  },
  {
    id: "ctg-006",
    tipo: "Vía cerrada",
    sector: "Centro / Getsemaní - Calle Media Luna",
    mapsUrl: "https://www.google.com/maps?q=10.4225,-75.5441",
    lat: 10.4225,
    lng: -75.5441,
    fecha: "Hace 1 hora",
    fuente: "Reporte ciudadano"
  }
];

// ============================================================================
// 3. ESTADO DE LA APLICACIÓN
// ============================================================================
const STORAGE_KEYS = {
  LOCAL_REPORTS: "cartavial_reportes_locales_v1",
  CONFIG: "cartavial_config_v1"
};

let map;
let markersLayer;
let allIncidents = [];
let activeFilter = "todos";
let isPickingOnMap = false;
let tempPickMarker = null;

// ============================================================================
// 4. INICIALIZACIÓN DEL MAPA (OpenStreetMap + Leaflet)
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  initMap();
  initUIEvents();
  loadAllData();

  // Auto-refrescar cada 45 segundos si hay un Google Sheet conectado
  setInterval(() => {
    const cfg = getConfig();
    if (cfg.googleSheetUrl) {
      loadAllData(true);
    }
  }, 45000);
});

function initMap() {
  map = L.map("map", {
    center: DEFAULT_CONFIG.cartagenaCenter,
    zoom: DEFAULT_CONFIG.defaultZoom,
    zoomControl: true
  });

  // Capa base OpenStreetMap con estilo claro y legible para vías urbanas
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · CartaVial Cartagena'
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);

  // Evento cuando el usuario elige tocar en el mapa para obtener ubicación
  map.on("click", (e) => {
    if (!isPickingOnMap) return;
    const lat = Number(e.latlng.lat.toFixed(6));
    const lng = Number(e.latlng.lng.toFixed(6));
    finishPickingOnMap(lat, lng);
  });
}

// ============================================================================
// 5. EXTRACCIÓN DE COORDENADAS DESDE LINKS DE GOOGLE MAPS O BARRIO
// ============================================================================
function extractCoordinates(mapsUrl, sectorText = "") {
  const raw = String(mapsUrl || "").trim();

  // 1) Patrón @lat,lng (ej: /@10.4136,-75.5219,17z)
  const atMatch = raw.match(/@(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]), metodo: "URL Google Maps (@)" };
  }

  // 2) Patrón ?q=lat,lng o &ll=lat,lng o query=lat,lng
  const queryMatch = raw.match(/(?:q|ll|query|center)=(-?\d+\.\d+)\s*(?:,|%2C)\s*(-?\d+\.\d+)/i);
  if (queryMatch) {
    return { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]), metodo: "URL Google Maps (?q=)" };
  }

  // 3) Patrón !3dlat!4dlng de Google Maps
  const bangMatch = raw.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (bangMatch) {
    return { lat: parseFloat(bangMatch[1]), lng: parseFloat(bangMatch[2]), metodo: "URL Google Maps (!3d!4d)" };
  }

  // 4) Coordenadas directas en cualquier parte del texto (rango cercano a Colombia/Cartagena)
  const pairMatch = raw.match(/(10\.\d{3,8})\s*,\s*(-75\.\d{3,8})/);
  if (pairMatch) {
    return { lat: parseFloat(pairMatch[1]), lng: parseFloat(pairMatch[2]), metodo: "Coordenadas en link" };
  }

  // Par genérico lat,lng
  const genericPair = raw.match(/(-?\d{1,2}\.\d{3,8})\s*,\s*(-?\d{2}\.\d{3,8})/);
  if (genericPair) {
    return { lat: parseFloat(genericPair[1]), lng: parseFloat(genericPair[2]), metodo: "Coordenadas directas" };
  }

  // 5) Respaldo por barrio/sector de Cartagena (para links acortados maps.app.goo.gl)
  const normalizedSector = normalizeText(sectorText + " " + raw);
  for (const item of SECTORES_CARTAGENA) {
    if (item.keywords.some((kw) => normalizedSector.includes(normalizeText(kw)))) {
      // Pequeña variación aleatoria (~80m) para que varios reportes del mismo barrio no queden uno encima del otro
      const jitterLat = (Math.random() - 0.5) * 0.0014;
      const jitterLng = (Math.random() - 0.5) * 0.0014;
      return {
        lat: Number((item.lat + jitterLat).toFixed(6)),
        lng: Number((item.lng + jitterLng).toFixed(6)),
        metodo: "Georreferenciado por sector en Cartagena"
      };
    }
  }

  // 6) Respaldo final en corredor central Av. Pedro de Heredia
  return {
    lat: Number((10.4085 + (Math.random() - 0.5) * 0.004).toFixed(6)),
    lng: Number((-75.5125 + (Math.random() - 0.5) * 0.004).toFixed(6)),
    metodo: "Ubicación aproximada en Cartagena"
  };
}

function normalizeText(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeIncidentType(rawType) {
  const t = normalizeText(rawType);
  if (t.includes("choque") || t.includes("accidente") || t.includes("colision")) {
    return "Choque";
  }
  if (t.includes("cerrada") || t.includes("cierre") || t.includes("bloqueo") || t.includes("obra")) {
    return "Vía cerrada";
  }
  if (t.includes("semaforo") || t.includes("dañado") || t.includes("apagado")) {
    return "Semáforo dañado";
  }
  return "Choque";
}

// ============================================================================
// 6. LECTURA DE DATOS ABIERTOS (JSON LOCAL + GOOGLE SHEETS EN VIVO)
// ============================================================================
async function loadAllData(silent = false) {
  const refreshBtn = document.getElementById("btn-refresh");
  if (refreshBtn) refreshBtn.classList.add("spinning");

  try {
    // 1. Cargar datos base (archivo JSON o semilla)
    let baseIncidents = [];
    try {
      const res = await fetch("data/incidentes.json", { cache: "no-store" });
      if (res.ok) {
        baseIncidents = await res.json();
      } else {
        baseIncidents = [...FALLBACK_INCIDENTS];
      }
    } catch {
      baseIncidents = [...FALLBACK_INCIDENTS];
    }

    // 2. Cargar reportes creados desde el navegador del usuario
    const localReports = getLocalReports();

    // 3. Si hay un Google Sheet configurado, leer sus filas como JSON en tiempo real
    const cfg = getConfig();
    let sheetIncidents = [];
    const configBtn = document.getElementById("btn-open-config");
    const subtitle = document.getElementById("status-subtitle");

    if (cfg.googleSheetUrl && cfg.googleSheetUrl.trim() !== "") {
      try {
        sheetIncidents = await fetchGoogleSheetAsJson(cfg.googleSheetUrl.trim());
        if (configBtn) configBtn.classList.add("connected");
        if (subtitle) {
          subtitle.textContent = `Conectado a Google Sheets (${sheetIncidents.length} reportes en la nube)`;
        }
      } catch (err) {
        console.warn("Error leyendo Google Sheet:", err);
        if (!silent) {
          showToast("⚠️ No se pudo leer el Google Sheet. Verifica que sea público.");
        }
      }
    } else {
      if (configBtn) configBtn.classList.remove("connected");
      if (subtitle) {
        subtitle.textContent = "Datos abiertos en tiempo real · Colaboración ciudadana";
      }
    }

    // Combinar reportes (primero los más recientes)
    allIncidents = [...localReports, ...sheetIncidents, ...baseIncidents];
    renderMarkers();
    updateCounters();
  } finally {
    if (refreshBtn) {
      setTimeout(() => refreshBtn.classList.remove("spinning"), 350);
    }
  }
}

/**
 * Convierte cualquier Google Sheet público en un arreglo JSON de incidentes
 * Soporta:
 * - Link normal de Google Sheets (/spreadsheets/d/ID/edit...)
 * - Endpoint Google Visualization JSON (/gviz/tq?tqx=out:json)
 * - Hoja publicada en la web como CSV (/pub?output=csv)
 * - Endpoint JSON directo (Google Apps Script / OpenSheet)
 */
async function fetchGoogleSheetAsJson(urlOrId) {
  let fetchUrl = urlOrId;

  // Extraer ID si el usuario pegó el link normal de Google Sheets
  const idMatch = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (idMatch && !urlOrId.includes("output=csv") && !urlOrId.includes("gviz/tq")) {
    const sheetId = idMatch[1];
    fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
  } else if (/^[a-zA-Z0-9-_]{25,}$/.test(urlOrId)) {
    fetchUrl = `https://docs.google.com/spreadsheets/d/${urlOrId}/gviz/tq?tqx=out:json`;
  }

  const response = await fetch(fetchUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const text = await response.text();

  // Caso A: Formato Google Visualization API (gviz/tq?tqx=out:json)
  if (text.includes("google.visualization.Query.setResponse")) {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    const jsonString = text.substring(jsonStart, jsonEnd + 1);
    const data = JSON.parse(jsonString);
    const rows = data.table?.rows || [];
    const cols = (data.table?.cols || []).map((c) => normalizeText(c.label || ""));

    return rows
      .map((row, index) => {
        const cells = (row.c || []).map((cell) => (cell && cell.v !== null && cell.v !== undefined ? String(cell.f || cell.v) : ""));
        return mapRowCellsToIncident(cells, cols, index);
      })
      .filter(Boolean)
      .reverse();
  }

  // Caso B: JSON directo (ej. Google Apps Script o JSON público)
  if (text.trim().startsWith("[") || text.trim().startsWith("{")) {
    const parsed = JSON.parse(text);
    const arr = Array.isArray(parsed) ? parsed : parsed.data || [];
    return arr
      .map((item, idx) => {
        const tipo = normalizeIncidentType(item.tipo || item["Tipo de problema"] || item.problema || "Choque");
        const sector = item.sector || item["Barrio o sector"] || item.barrio || "Cartagena";
        const mapsUrl = item.mapsUrl || item["Enlace de ubicación de Google Maps"] || item.ubicacion || "";
        const coords = item.lat && item.lng ? { lat: Number(item.lat), lng: Number(item.lng) } : extractCoordinates(mapsUrl, sector);
        return {
          id: item.id || `sheet-${idx}`,
          tipo,
          sector,
          mapsUrl: mapsUrl || `https://www.google.com/maps?q=${coords.lat},${coords.lng}`,
          lat: coords.lat,
          lng: coords.lng,
          fecha: item.fecha || item["Marca temporal"] || "Reporte en Google Sheets",
          fuente: "Google Sheets"
        };
      })
      .reverse();
  }

  // Caso C: CSV publicado en la web
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];
  const headers = parseCsvLine(lines[0]).map(normalizeText);
  return lines
    .slice(1)
    .map((line, idx) => mapRowCellsToIncident(parseCsvLine(line), headers, idx))
    .filter(Boolean)
    .reverse();
}

function mapRowCellsToIncident(cells, headers, idx) {
  const nonEmpty = cells.filter((c) => c && c.trim() !== "");
  if (nonEmpty.length === 0) return null;

  // Ignorar fila si coincide con los encabezados
  if (normalizeText(cells.join(" ")).includes("tipo de problema")) {
    return null;
  }

  let fecha = "Reciente";
  let tipoRaw = "";
  let sector = "";
  let mapsUrl = "";

  // Si Google Forms tiene 4 columnas: [Marca temporal, Tipo de problema, Barrio/Sector, Enlace Google Maps]
  if (cells.length >= 4) {
    fecha = cells[0] || "Reciente";
    tipoRaw = cells[1] || "Choque";
    sector = cells[2] || "Cartagena";
    mapsUrl = cells[3] || "";
  } else if (cells.length === 3) {
    tipoRaw = cells[0] || "Choque";
    sector = cells[1] || "Cartagena";
    mapsUrl = cells[2] || "";
  } else {
    tipoRaw = cells[0] || "Choque";
    sector = cells[1] || "Cartagena";
  }

  const tipo = normalizeIncidentType(tipoRaw);
  const coords = extractCoordinates(mapsUrl, sector);

  return {
    id: `gsheet-${idx}`,
    tipo,
    sector: sector.trim(),
    mapsUrl: mapsUrl.trim() || `https://www.google.com/maps?q=${coords.lat},${coords.lng}`,
    lat: coords.lat,
    lng: coords.lng,
    fecha: fecha,
    fuente: "Google Sheets"
  };
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ============================================================================
// 7. DIBUJAR PINES EN EL MAPA CON LEAFLET
// ============================================================================
function renderMarkers() {
  markersLayer.clearLayers();

  const filtered =
    activeFilter === "todos"
      ? allIncidents
      : allIncidents.filter((inc) => inc.tipo === activeFilter);

  filtered.forEach((inc) => {
    if (!inc.lat || !inc.lng || isNaN(inc.lat) || isNaN(inc.lng)) return;

    const visual = getIncidentVisuals(inc.tipo);

    const icon = L.divIcon({
      className: "custom-pin-wrapper",
      html: `
        <div class="pin-pulse ${visual.pulseClass}"></div>
        <div class="pin-marker ${visual.pinClass}">
          <span class="pin-inner">${visual.emoji}</span>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 36],
      popupAnchor: [0, -34]
    });

    const safeSector = escapeHtml(inc.sector);
    const safeFecha = escapeHtml(inc.fecha || "Hace pocos minutos");
    const safeUrl =
      inc.mapsUrl && inc.mapsUrl.startsWith("http")
        ? inc.mapsUrl
        : `https://www.google.com/maps?q=${inc.lat},${inc.lng}`;

    const popupHtml = `
      <div>
        <span class="popup-badge ${visual.badgeClass}">
          ${visual.emoji} ${escapeHtml(inc.tipo)}
        </span>
        <div class="popup-sector">${safeSector}</div>
        <div class="popup-meta">
          🕒 ${safeFecha} · 📍 ${Number(inc.lat).toFixed(4)}, ${Number(inc.lng).toFixed(4)}
        </div>
        <a class="popup-link" href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">
          🗺️ Ver punto en Google Maps ↗
        </a>
      </div>
    `;

    const marker = L.marker([inc.lat, inc.lng], { icon });
    marker.bindPopup(popupHtml);
    markersLayer.addLayer(marker);
  });
}

function getIncidentVisuals(tipo) {
  if (tipo === "Vía cerrada") {
    return {
      emoji: "🚧",
      pinClass: "pin-via",
      pulseClass: "pulse-via",
      badgeClass: "badge-via"
    };
  }
  if (tipo === "Semáforo dañado") {
    return {
      emoji: "🚦",
      pinClass: "pin-semaforo",
      pulseClass: "pulse-semaforo",
      badgeClass: "badge-semaforo"
    };
  }
  return {
    emoji: "💥",
    pinClass: "pin-choque",
    pulseClass: "pulse-choque",
    badgeClass: "badge-choque"
  };
}

function updateCounters() {
  const total = allIncidents.length;
  const choques = allIncidents.filter((i) => i.tipo === "Choque").length;
  const vias = allIncidents.filter((i) => i.tipo === "Vía cerrada").length;
  const semaforos = allIncidents.filter((i) => i.tipo === "Semáforo dañado").length;

  document.getElementById("count-todos").textContent = total;
  document.getElementById("count-choque").textContent = choques;
  document.getElementById("count-via").textContent = vias;
  document.getElementById("count-semaforo").textContent = semaforos;
}

// ============================================================================
// 8. EVENTOS DE INTERFAZ Y FORMULARIO DE REPORTE
// ============================================================================
function initUIEvents() {
  // Filtros superiores
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((c) => {
        c.classList.remove("active");
        c.setAttribute("aria-selected", "false");
      });
      chip.classList.add("active");
      chip.setAttribute("aria-selected", "true");
      activeFilter = chip.dataset.filter;
      renderMarkers();
    });
  });

  // Botones de acceso rápido a corredores de Cartagena
  document.querySelectorAll(".corridor-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lat = parseFloat(btn.dataset.lat);
      const lng = parseFloat(btn.dataset.lng);
      const zoom = parseInt(btn.dataset.zoom, 10) || 14;
      map.flyTo([lat, lng], zoom, { duration: 0.8 });
    });
  });

  // Botón refrescar
  document.getElementById("btn-refresh").addEventListener("click", () => {
    loadAllData(false);
    showToast("🔄 Mapa actualizado con los últimos reportes");
  });

  // Botón centrar en mi ubicación
  document.getElementById("btn-locate-me").addEventListener("click", () => {
    if (!navigator.geolocation) {
      showToast("⚠️ Tu navegador no soporta geolocalización");
      return;
    }
    showToast("📍 Obteniendo tu ubicación actual...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 16, { duration: 0.9 });
        L.circleMarker([latitude, longitude], {
          radius: 8,
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 0.9
        })
          .addTo(map)
          .bindPopup("📍 Estás aquí")
          .openPopup();
      },
      () => {
        showToast("ℹ️ Mostrando vista central de Cartagena");
        map.flyTo(DEFAULT_CONFIG.cartagenaCenter, 14);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  });

  // Abrir / Cerrar Modal de Reportar Incidente
  const modalReport = document.getElementById("modal-report");
  document.getElementById("btn-report-incident").addEventListener("click", () => {
    updateExternalFormBanner();
    modalReport.classList.remove("hidden");
  });
  document.getElementById("btn-close-report").addEventListener("click", () => {
    modalReport.classList.add("hidden");
  });

  // Sugerencias rápidas de sector
  document.querySelectorAll(".sector-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      const sectorInput = document.getElementById("input-sector");
      sectorInput.value = pill.dataset.sector;
      updateCoordPreview();
    });
  });

  // Vista previa de coordenadas al escribir link o sector
  document.getElementById("input-maps-url").addEventListener("input", updateCoordPreview);
  document.getElementById("input-sector").addEventListener("input", updateCoordPreview);

  // Botón "Generar link con mi GPS" dentro del formulario
  document.getElementById("btn-use-gps").addEventListener("click", () => {
    const mapsInput = document.getElementById("input-maps-url");
    if (!navigator.geolocation) {
      const center = map.getCenter();
      mapsInput.value = `https://www.google.com/maps?q=${center.lat.toFixed(6)},${center.lng.toFixed(6)}`;
      updateCoordPreview();
      return;
    }

    showToast("📍 Obteniendo coordenadas del GPS...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        mapsInput.value = `https://www.google.com/maps?q=${lat},${lng}`;
        updateCoordPreview();
        showToast("✅ Enlace de Google Maps generado con tu GPS");
      },
      () => {
        const center = map.getCenter();
        mapsInput.value = `https://www.google.com/maps?q=${center.lat.toFixed(6)},${center.lng.toFixed(6)}`;
        updateCoordPreview();
        showToast("📍 Se usó el punto central actual del mapa");
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });

  // Botón "Elegir punto en el mapa"
  document.getElementById("btn-pick-on-map").addEventListener("click", () => {
    modalReport.classList.add("hidden");
    isPickingOnMap = true;
    document.getElementById("map-pick-banner").classList.remove("hidden");
  });

  document.getElementById("btn-cancel-pick").addEventListener("click", () => {
    isPickingOnMap = false;
    document.getElementById("map-pick-banner").classList.add("hidden");
    modalReport.classList.remove("hidden");
  });

  // Envío del formulario de 3 preguntas
  document.getElementById("form-incident").addEventListener("submit", handleReportSubmit);

  // Modal JSON Abierto
  const modalJson = document.getElementById("modal-json");
  document.getElementById("btn-open-json").addEventListener("click", () => {
    document.getElementById("json-viewer").textContent = JSON.stringify(allIncidents, null, 2);
    modalJson.classList.remove("hidden");
  });
  document.getElementById("btn-close-json").addEventListener("click", () => {
    modalJson.classList.add("hidden");
  });
  document.getElementById("btn-copy-json").addEventListener("click", () => {
    navigator.clipboard.writeText(JSON.stringify(allIncidents, null, 2));
    showToast("📋 JSON copiado al portapapeles");
  });
  document.getElementById("btn-download-json").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(allIncidents, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "incidentes-cartavial.json";
    a.click();
    URL.revokeObjectURL(url);
  });
  document.getElementById("btn-reset-demo").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEYS.LOCAL_REPORTS);
    loadAllData();
    modalJson.classList.add("hidden");
    showToast("🔄 Datos restaurados al estado inicial");
  });

  // Modal Configuración Google Sheets / Forms
  const modalConfig = document.getElementById("modal-config");
  document.getElementById("btn-open-config").addEventListener("click", () => {
    const cfg = getConfig();
    document.getElementById("input-sheet-url").value = cfg.googleSheetUrl || "";
    document.getElementById("input-form-url").value = cfg.googleFormUrl || "";
    modalConfig.classList.remove("hidden");
  });
  document.getElementById("btn-close-config").addEventListener("click", () => {
    modalConfig.classList.add("hidden");
  });

  document.getElementById("btn-test-sheet").addEventListener("click", async () => {
    const url = document.getElementById("input-sheet-url").value.trim();
    if (!url) {
      showToast("⚠️ Pega primero el enlace de tu Google Sheet");
      return;
    }
    try {
      showToast("🔍 Probando lectura JSON desde Google Sheets...");
      const items = await fetchGoogleSheetAsJson(url);
      showToast(`✅ Conexión exitosa: ${items.length} filas leídas del Sheet`);
    } catch {
      showToast("❌ No se pudo leer. Asegúrate de compartir el Sheet como 'Cualquier persona con el enlace'");
    }
  });

  document.getElementById("form-config").addEventListener("submit", (e) => {
    e.preventDefault();
    const googleSheetUrl = document.getElementById("input-sheet-url").value.trim();
    const googleFormUrl = document.getElementById("input-form-url").value.trim();
    saveConfig({ googleSheetUrl, googleFormUrl });
    modalConfig.classList.add("hidden");
    loadAllData();
    showToast("✅ Configuración guardada");
  });

  // Cerrar modales al tocar el fondo oscuro
  document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        backdrop.classList.add("hidden");
      }
    });
  });
}

function finishPickingOnMap(lat, lng) {
  isPickingOnMap = false;
  document.getElementById("map-pick-banner").classList.add("hidden");

  if (tempPickMarker) {
    map.removeLayer(tempPickMarker);
  }
  tempPickMarker = L.circleMarker([lat, lng], {
    radius: 7,
    color: "#dc2626",
    fillColor: "#ef4444",
    fillOpacity: 0.85
  }).addTo(map);

  const mapsInput = document.getElementById("input-maps-url");
  mapsInput.value = `https://www.google.com/maps?q=${lat},${lng}`;
  updateCoordPreview();

  document.getElementById("modal-report").classList.remove("hidden");
  showToast(`📍 Punto seleccionado (${lat}, ${lng})`);
}

function updateCoordPreview() {
  const mapsUrl = document.getElementById("input-maps-url").value.trim();
  const sector = document.getElementById("input-sector").value.trim();
  const preview = document.getElementById("coord-preview");

  if (!mapsUrl && !sector) {
    preview.textContent = "Puedes pegar un link de Google Maps, usar tu GPS en 1 toque o tocar el punto en el mapa.";
    return;
  }

  const coords = extractCoordinates(mapsUrl, sector);
  preview.textContent = `📌 Pin listo en: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)} (${coords.metodo})`;
}

async function handleReportSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const tipo = formData.get("tipo") || "Choque";
  const sector = (formData.get("sector") || "").trim();
  const mapsUrl = (formData.get("mapsUrl") || "").trim();

  if (!sector || !mapsUrl) {
    showToast("⚠️ Por favor completa el barrio/sector y el enlace de ubicación");
    return;
  }

  const coords = extractCoordinates(mapsUrl, sector);
  const newIncident = {
    id: `ctg-${Date.now()}`,
    tipo: normalizeIncidentType(tipo),
    sector,
    mapsUrl,
    lat: coords.lat,
    lng: coords.lng,
    fecha: "Justo ahora",
    fuente: "Colaboración ciudadana"
  };

  // 1. Guardar inmediatamente y mostrar el pin en el mapa
  const currentLocal = getLocalReports();
  currentLocal.unshift(newIncident);
  localStorage.setItem(STORAGE_KEYS.LOCAL_REPORTS, JSON.stringify(currentLocal));

  // 2. Si el usuario configuró un endpoint de Google Apps Script, enviarlo también a la nube
  const cfg = getConfig();
  if (cfg.googleFormUrl && cfg.googleFormUrl.includes("script.google.com")) {
    try {
      fetch(cfg.googleFormUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIncident)
      });
    } catch (err) {
      console.warn("No se pudo enviar a Apps Script:", err);
    }
  }

  // Limpiar formulario y cerrar modal
  e.target.reset();
  if (tempPickMarker) {
    map.removeLayer(tempPickMarker);
    tempPickMarker = null;
  }
  document.getElementById("modal-report").classList.add("hidden");

  // Actualizar el mapa y volar hacia el nuevo pin
  await loadAllData(true);
  map.flyTo([newIncident.lat, newIncident.lng], 16, { duration: 0.9 });

  showToast("✅ ¡Incidente publicado en el mapa de Cartagena!");
}

// ============================================================================
// 9. UTILIDADES DE ALMACENAMIENTO Y CONFIGURACIÓN
// ============================================================================
function getLocalReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_REPORTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    const saved = raw ? JSON.parse(raw) : {};
    return {
      googleSheetUrl: saved.googleSheetUrl || DEFAULT_CONFIG.googleSheetUrl,
      googleFormUrl: saved.googleFormUrl || DEFAULT_CONFIG.googleFormUrl
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig(newCfg) {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(newCfg));
}

function updateExternalFormBanner() {
  const cfg = getConfig();
  const banner = document.getElementById("external-form-banner");
  const link = document.getElementById("link-external-google-form");

  if (cfg.googleFormUrl && cfg.googleFormUrl.includes("docs.google.com/forms")) {
    link.href = cfg.googleFormUrl;
    banner.classList.remove("hidden");
  } else {
    banner.classList.add("hidden");
  }
}

let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.remove("hidden");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 3600);
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
