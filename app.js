/**
 * CartaVial — Inteligencia ciudadana para movernos mejor en Cartagena
 * Rediseño UX/UI Senior: Estética Google Maps + Waze · Datos Abiertos
 */

// ============================================================================
// 1. CONFIGURACIÓN PRINCIPAL (Conectada en vivo a tu Google Sheet via Apps Script)
// ============================================================================
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbx2Sa3SOtSfz-LEPmpvkisuk56VfP-pSRnJ1nErVOGkMcb8RRoz_fBT09XRSATDnTaW/exec";

const DEFAULT_CONFIG = {
  googleSheetUrl: APPS_SCRIPT_URL,
  googleFormUrl: APPS_SCRIPT_URL,
  cartagenaCenter: [10.4025, -75.5140],
  defaultZoom: 13
};

// ============================================================================
// 2. DICCIONARIO GEORREFERENCIADO DE SECTORES Y VÍAS DE CARTAGENA
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
  { keywords: ["ternera", "san jose", "san josé", "universidad"], lat: 10.3812, lng: -75.4685 },
  { keywords: ["pedro de heredia"], lat: 10.4095, lng: -75.5105 }
];

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
  },
  {
    id: "ctg-007",
    tipo: "Hueco",
    sector: "Av. Pedro de Heredia - Sector Cuatro Vientos (Carril Mixto)",
    mapsUrl: "https://www.google.com/maps?q=10.4079,-75.5061",
    lat: 10.4079,
    lng: -75.5061,
    fecha: "Hace 1 hora",
    fuente: "Reporte ciudadano"
  }
];

// ============================================================================
// 3. ESTADO GLOBAL
// ============================================================================
const STORAGE_KEYS = {
  LOCAL_REPORTS: "cartavial_reportes_locales_v2",
  CONFIG: "cartavial_config_v2"
};

let map;
let markersLayer;
let allIncidents = [];
let activeFilter = "todos";
let isPickingOnMap = false;
let tempPickMarker = null;
let lastDataSignature = "";

// ============================================================================
// 4. INICIALIZACIÓN DEL MAPA (Estética Limpia estilo Google Maps)
// ============================================================================
document.addEventListener("DOMContentLoaded", async () => {
  initMap();
  initUIEvents();
  await syncPendingLocalReportsToServer();
  await loadAllData();

  // Sincronización automática en tiempo real cada 3.5 segundos
  setInterval(() => {
    loadAllData(true);
  }, 3500);
});

function initMap() {
  map = L.map("map", {
    center: DEFAULT_CONFIG.cartagenaCenter,
    zoom: DEFAULT_CONFIG.defaultZoom,
    zoomControl: false
  });

  // Servidor oficial y 100% gratuito de OpenStreetMap (sin API Keys) estilizado vía CSS
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    className: "osm-google-clean-tiles",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · CartaVial Cartagena'
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);

  map.on("click", (e) => {
    if (!isPickingOnMap) return;
    const lat = Number(e.latlng.lat.toFixed(6));
    const lng = Number(e.latlng.lng.toFixed(6));
    finishPickingOnMap(lat, lng);
  });
}

// ============================================================================
// 5. EXTRACCIÓN DE COORDENADAS DESDE LINKS DE GOOGLE MAPS O SECTOR
// ============================================================================
function extractCoordinates(mapsUrl, sectorText = "") {
  const raw = String(mapsUrl || "").trim();

  const atMatch = raw.match(/@(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]), metodo: "Coordenadas exactas de Google Maps" };
  }

  const queryMatch = raw.match(/(?:q|ll|query|center)=(-?\d+\.\d+)\s*(?:,|%2C)\s*(-?\d+\.\d+)/i);
  if (queryMatch) {
    return { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]), metodo: "Coordenadas exactas de ubicación" };
  }

  const bangMatch = raw.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (bangMatch) {
    return { lat: parseFloat(bangMatch[1]), lng: parseFloat(bangMatch[2]), metodo: "Coordenadas exactas de Google Maps" };
  }

  const pairMatch = raw.match(/(10\.\d{3,8})\s*,\s*(-75\.\d{3,8})/);
  if (pairMatch) {
    return { lat: parseFloat(pairMatch[1]), lng: parseFloat(pairMatch[2]), metodo: "Coordenadas en Cartagena" };
  }

  const genericPair = raw.match(/(-?\d{1,2}\.\d{3,8})\s*,\s*(-?\d{2}\.\d{3,8})/);
  if (genericPair) {
    return { lat: parseFloat(genericPair[1]), lng: parseFloat(genericPair[2]), metodo: "Coordenadas directas" };
  }

  const normalizedSector = normalizeText(sectorText + " " + raw);
  for (const item of SECTORES_CARTAGENA) {
    if (item.keywords.some((kw) => normalizedSector.includes(normalizeText(kw)))) {
      const jitterLat = (Math.random() - 0.5) * 0.0012;
      const jitterLng = (Math.random() - 0.5) * 0.0012;
      return {
        lat: Number((item.lat + jitterLat).toFixed(6)),
        lng: Number((item.lng + jitterLng).toFixed(6)),
        metodo: "Georreferenciado por sector en Cartagena"
      };
    }
  }

  return {
    lat: Number((10.4085 + (Math.random() - 0.5) * 0.003).toFixed(6)),
    lng: Number((-75.5125 + (Math.random() - 0.5) * 0.003).toFixed(6)),
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
  if (t.includes("hueco") || t.includes("dano") || t.includes("alcantarilla") || t.includes("hundimiento")) {
    return "Hueco";
  }
  if (t.includes("cerrada") || t.includes("cierre") || t.includes("bloqueo") || t.includes("obra") || t.includes("trancon") || t.includes("trafico")) {
    return "Vía cerrada";
  }
  if (t.includes("semaforo") || t.includes("sem") || t.includes("apagado") || t.includes("intermitente")) {
    return "Semáforo dañado";
  }
  return "Choque";
}

// ============================================================================
// 6. SINCRONIZACIÓN Y LECTURA DE DATOS ABIERTOS (SERVIDOR + GOOGLE SHEETS)
// ============================================================================
async function syncPendingLocalReportsToServer() {
  const localReports = getLocalReports();
  if (localReports.length === 0) return;

  try {
    for (const item of [...localReports].reverse()) {
      const res = await fetch("/api/incidentes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
      });
      if (!res.ok) return;
    }
    localStorage.removeItem(STORAGE_KEYS.LOCAL_REPORTS);
  } catch {
    // Mantiene respaldo local si no hay servidor con API
  }
}

async function loadAllData(silent = false) {
  const refreshBtn = document.getElementById("btn-refresh");
  if (refreshBtn && !silent) refreshBtn.classList.add("spinning");

  try {
    let baseIncidents = [];
    try {
      const res = await fetch(`data/incidentes.json?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        baseIncidents = await res.json();
      } else {
        baseIncidents = [...FALLBACK_INCIDENTS];
      }
    } catch {
      baseIncidents = [...FALLBACK_INCIDENTS];
    }

    const localReports = getLocalReports();
    const cfg = getConfig();
    let sheetIncidents = [];
    const configBtn = document.getElementById("btn-open-config");
    const subtitle = document.getElementById("status-subtitle");

    if (cfg.googleSheetUrl && cfg.googleSheetUrl.trim() !== "") {
      try {
        sheetIncidents = await fetchGoogleSheetAsJson(cfg.googleSheetUrl.trim());
        if (configBtn) configBtn.classList.add("connected");
        if (subtitle) {
          subtitle.textContent = `Google Sheets activo (${sheetIncidents.length} reportes)`;
        }
      } catch (err) {
        console.warn("Error leyendo Google Sheet:", err);
        if (!silent) {
          showToast("No se pudo leer el Google Sheet. Verifica que sea público.");
        }
      }
    } else {
      if (configBtn) configBtn.classList.remove("connected");
      if (subtitle) {
        subtitle.textContent = "Mapa colaborativo en tiempo real";
      }
    }

    const seenIds = new Set();
    const combined = [];
    for (const item of [...localReports, ...sheetIncidents, ...baseIncidents]) {
      const normalizedItem = {
        ...item,
        tipo: normalizeIncidentType(item.tipo)
      };
      // Clave única por tipo + sector + coordenadas para no duplicar entre servidor local y Google Sheets
      const dedupeKey = `${normalizeText(normalizedItem.tipo)}|${normalizeText(normalizedItem.sector)}|${Number(normalizedItem.lat).toFixed(4)}|${Number(normalizedItem.lng).toFixed(4)}`;
      if (!seenIds.has(dedupeKey)) {
        seenIds.add(dedupeKey);
        combined.push(normalizedItem);
      }
    }

    const newSignature = JSON.stringify(combined.map((i) => i.id)) + "|" + activeFilter;
    const hadPrevious = lastDataSignature !== "";
    const prevCount = allIncidents.length;

    allIncidents = combined;
    updateCounters();

    if (!silent || newSignature !== lastDataSignature) {
      lastDataSignature = newSignature;
      renderMarkers();
      if (silent && hadPrevious && combined.length > prevCount) {
        showToast("Nuevo incidente reportado en el mapa");
      }
    }
  } finally {
    if (refreshBtn && !silent) {
      setTimeout(() => refreshBtn.classList.remove("spinning"), 350);
    }
  }
}

async function fetchGoogleSheetAsJson(urlOrId) {
  let fetchUrl = urlOrId;

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

  if (text.trim().startsWith("[") || text.trim().startsWith("{")) {
    const parsed = JSON.parse(text);
    const arr = Array.isArray(parsed) ? parsed : parsed.data || [];
    return arr
      .map((item, idx) => {
        const rawSector = String(item.sector || item["Barrio o sector"] || item.barrio || "").trim();
        const rawMapsUrl = String(item.mapsUrl || item["Enlace de ubicación de Google Maps"] || item.ubicacion || "").trim();
        if (!rawSector && !rawMapsUrl) return null;
        if (normalizeText(rawSector).includes("barrio o sector")) return null;

        const tipo = normalizeIncidentType(item.tipo || item["Tipo de problema"] || item.problema || "Choque");
        const sector = rawSector || "Cartagena";
        const coords =
          item.lat && item.lng
            ? { lat: Number(item.lat), lng: Number(item.lng) }
            : extractCoordinates(rawMapsUrl, sector);
        return {
          id: `sheet-${normalizeText(tipo)}-${normalizeText(sector)}-${coords.lat.toFixed(4)}-${coords.lng.toFixed(4)}-${idx}`,
          tipo,
          sector,
          mapsUrl: rawMapsUrl || `https://www.google.com/maps?q=${coords.lat},${coords.lng}`,
          lat: coords.lat,
          lng: coords.lng,
          fecha: item.fecha || item["Marca temporal"] || "En Google Sheets",
          fuente: "Google Sheets"
        };
      })
      .filter(Boolean)
      .reverse();
  }

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

  if (normalizeText(cells.join(" ")).includes("tipo de problema")) {
    return null;
  }

  let fecha = "Reciente";
  let tipoRaw = "";
  let sector = "";
  let mapsUrl = "";

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
// 7. MARCADORES VECTORIALES ESTILO WAZE (ALTO CONTRASTE Y SOMBRAS SUAVES)
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
      className: "waze-marker-wrapper",
      html: `
        <div class="waze-pin-container">
          <div class="waze-pin-halo ${visual.haloClass}"></div>
          <div class="waze-pin-bubble ${visual.bubbleClass}">
            ${visual.svgIcon}
          </div>
          <div class="waze-pin-tail"></div>
        </div>
      `,
      iconSize: [48, 54],
      iconAnchor: [24, 50],
      popupAnchor: [0, -46]
    });

    const safeSector = escapeHtml(inc.sector);
    const safeFecha = escapeHtml(inc.fecha || "Hace pocos minutos");
    const safeUrl =
      inc.mapsUrl && inc.mapsUrl.startsWith("http")
        ? inc.mapsUrl
        : `https://www.google.com/maps?q=${inc.lat},${inc.lng}`;

    const popupHtml = `
      <div>
        <span class="popup-category-tag ${visual.tagClass}">
          ${escapeHtml(inc.tipo)}
        </span>
        <div class="popup-title">${safeSector}</div>
        <div class="popup-meta-line">
          <span>Reportado: ${safeFecha}</span>
          <span>·</span>
          <span>${Number(inc.lat).toFixed(4)}, ${Number(inc.lng).toFixed(4)}</span>
        </div>
        <a class="popup-maps-btn" href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">
          <span>Abrir ubicación en Google Maps</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
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
      bubbleClass: "bubble-via",
      haloClass: "halo-via",
      tagClass: "tag-via",
      svgIcon: `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="6" width="18" height="6" rx="1.5"/>
          <path d="M6 12v6M18 12v6M7 6l3 6M14 6l3 6"/>
        </svg>
      `
    };
  }
  if (tipo === "Semáforo dañado") {
    return {
      bubbleClass: "bubble-semaforo",
      haloClass: "halo-semaforo",
      tagClass: "tag-semaforo",
      svgIcon: `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <rect x="7" y="2" width="10" height="20" rx="3"/>
          <circle cx="12" cy="7" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="17" r="1.5" fill="currentColor"/>
        </svg>
      `
    };
  }
  if (tipo === "Hueco") {
    return {
      bubbleClass: "bubble-hueco",
      haloClass: "halo-hueco",
      tagClass: "tag-hueco",
      svgIcon: `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      `
    };
  }
  return {
    bubbleClass: "bubble-choque",
    haloClass: "halo-choque",
    tagClass: "tag-choque",
    svgIcon: `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/>
        <path d="M9 17h6"/>
        <circle cx="17" cy="17" r="2"/>
      </svg>
    `
  };
}

function updateCounters() {
  const total = allIncidents.length;
  const choques = allIncidents.filter((i) => i.tipo === "Choque").length;
  const vias = allIncidents.filter((i) => i.tipo === "Vía cerrada").length;
  const semaforos = allIncidents.filter((i) => i.tipo === "Semáforo dañado").length;
  const huecos = allIncidents.filter((i) => i.tipo === "Hueco").length;

  document.getElementById("count-todos").textContent = total;
  document.getElementById("count-choque").textContent = choques;
  document.getElementById("count-via").textContent = vias;
  document.getElementById("count-semaforo").textContent = semaforos;
  const huecoEl = document.getElementById("count-hueco");
  if (huecoEl) huecoEl.textContent = huecos;
}

// ============================================================================
// 8. INTERACCIONES Y FORMULARIO PASO A PASO
// ============================================================================
function initUIEvents() {
  // Píldoras de filtro por categoría
  document.querySelectorAll(".filter-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".filter-pill").forEach((p) => {
        p.classList.remove("active");
        p.setAttribute("aria-selected", "false");
      });
      pill.classList.add("active");
      pill.setAttribute("aria-selected", "true");
      activeFilter = pill.dataset.filter;
      lastDataSignature = "";
      renderMarkers();
    });
  });

  // Salto rápido a corredores de Cartagena
  document.querySelectorAll(".corridor-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".corridor-chip").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const lat = parseFloat(btn.dataset.lat);
      const lng = parseFloat(btn.dataset.lng);
      const zoom = parseInt(btn.dataset.zoom, 10) || 14;
      map.flyTo([lat, lng], zoom, { duration: 0.85 });
    });
  });

  // Controles de zoom táctiles
  document.getElementById("btn-zoom-in").addEventListener("click", () => map.zoomIn());
  document.getElementById("btn-zoom-out").addEventListener("click", () => map.zoomOut());

  // Botón sincronizar
  document.getElementById("btn-refresh").addEventListener("click", async () => {
    await syncPendingLocalReportsToServer();
    lastDataSignature = "";
    await loadAllData(false);
    showToast("Mapa sincronizado en tiempo real");
  });

  // Botón centrar en mi ubicación actual
  document.getElementById("btn-locate-me").addEventListener("click", () => {
    if (!navigator.geolocation) {
      showToast("Tu navegador no soporta geolocalización");
      return;
    }
    showToast("Obteniendo tu ubicación GPS...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 16, { duration: 0.9 });
        L.circleMarker([latitude, longitude], {
          radius: 8,
          color: "#ffffff",
          weight: 3,
          fillColor: "#2563eb",
          fillOpacity: 1
        })
          .addTo(map)
          .bindPopup("<strong>Tu ubicación actual</strong>")
          .openPopup();
      },
      () => {
        showToast("Mostrando vista central de Cartagena");
        map.flyTo(DEFAULT_CONFIG.cartagenaCenter, 14);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  });

  // Abrir y cerrar Side-Panel de reporte
  const modalReport = document.getElementById("modal-report");
  document.getElementById("btn-report-incident").addEventListener("click", () => {
    updateExternalFormBanner();
    modalReport.classList.remove("hidden");
  });
  document.getElementById("btn-close-report").addEventListener("click", () => {
    modalReport.classList.add("hidden");
  });

  // Etiquetas rápidas de sector
  document.querySelectorAll(".sector-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      const sectorInput = document.getElementById("input-sector");
      sectorInput.value = pill.dataset.sector;
      updateCoordPreview();
    });
  });

  document.getElementById("input-maps-url").addEventListener("input", updateCoordPreview);
  document.getElementById("input-sector").addEventListener("input", updateCoordPreview);

  // Botón principal "Usar mi ubicación actual" con GPS
  document.getElementById("btn-use-gps").addEventListener("click", () => {
    const mapsInput = document.getElementById("input-maps-url");
    if (!navigator.geolocation) {
      const center = map.getCenter();
      mapsInput.value = `https://www.google.com/maps?q=${center.lat.toFixed(6)},${center.lng.toFixed(6)}`;
      updateCoordPreview();
      return;
    }

    showToast("Obteniendo coordenadas exactas del GPS...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        mapsInput.value = `https://www.google.com/maps?q=${lat},${lng}`;
        updateCoordPreview();
        showToast("Ubicación GPS capturada con éxito");
      },
      () => {
        const center = map.getCenter();
        mapsInput.value = `https://www.google.com/maps?q=${center.lat.toFixed(6)},${center.lng.toFixed(6)}`;
        updateCoordPreview();
        showToast("Se tomó el punto central actual del mapa");
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });

  // Botón "Marcar punto en el mapa"
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

  // Envío del reporte
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
    showToast("JSON copiado al portapapeles");
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
  document.getElementById("btn-reset-demo").addEventListener("click", async () => {
    localStorage.removeItem(STORAGE_KEYS.LOCAL_REPORTS);
    try {
      await fetch("/api/reset", { method: "POST" });
    } catch {
      // Ignorar si no hay servidor con API
    }
    lastDataSignature = "";
    await loadAllData();
    modalJson.classList.add("hidden");
    showToast("Datos restaurados al estado inicial");
  });

  // Modal Configuración Google Sheets
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
      showToast("Pega primero el enlace de tu Google Sheet");
      return;
    }
    try {
      showToast("Verificando lectura JSON desde Google Sheets...");
      const items = await fetchGoogleSheetAsJson(url);
      showToast(`Conexión exitosa: ${items.length} reportes leídos`);
    } catch {
      showToast("No se pudo leer. Comparte el Sheet como 'Cualquier persona con el enlace'");
    }
  });

  document.getElementById("form-config").addEventListener("submit", (e) => {
    e.preventDefault();
    const googleSheetUrl = document.getElementById("input-sheet-url").value.trim();
    const googleFormUrl = document.getElementById("input-form-url").value.trim();
    saveConfig({ googleSheetUrl, googleFormUrl });
    modalConfig.classList.add("hidden");
    lastDataSignature = "";
    loadAllData();
    showToast("Configuración guardada correctamente");
  });

  document.querySelectorAll(".panel-backdrop").forEach((backdrop) => {
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
    radius: 8,
    color: "#ffffff",
    weight: 3,
    fillColor: "#ff3b30",
    fillOpacity: 1
  }).addTo(map);

  const mapsInput = document.getElementById("input-maps-url");
  mapsInput.value = `https://www.google.com/maps?q=${lat},${lng}`;
  updateCoordPreview();

  document.getElementById("modal-report").classList.remove("hidden");
  showToast(`Punto fijado en el mapa (${lat}, ${lng})`);
}

function updateCoordPreview() {
  const mapsUrl = document.getElementById("input-maps-url").value.trim();
  const sector = document.getElementById("input-sector").value.trim();
  const preview = document.getElementById("coord-preview");

  if (!mapsUrl && !sector) {
    preview.textContent = 'Toca "Usar mi ubicación actual", marca el punto en el mapa o pega un link de Google Maps.';
    return;
  }

  const coords = extractCoordinates(mapsUrl, sector);
  preview.textContent = `Coordenadas listas: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)} · ${coords.metodo}`;
}

async function handleReportSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const tipo = formData.get("tipo") || "Choque";
  const sector = (formData.get("sector") || "").trim();
  const mapsUrl = (formData.get("mapsUrl") || "").trim();

  if (!sector || !mapsUrl) {
    showToast("Completa la ubicación y el barrio o sector de referencia");
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

  let savedToSharedServer = false;
  try {
    const res = await fetch("/api/incidentes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newIncident)
    });
    if (res.ok) {
      savedToSharedServer = true;
    }
  } catch {
    savedToSharedServer = false;
  }

  if (!savedToSharedServer) {
    const currentLocal = getLocalReports();
    currentLocal.unshift(newIncident);
    localStorage.setItem(STORAGE_KEYS.LOCAL_REPORTS, JSON.stringify(currentLocal));
  }

  const cfg = getConfig();
  if (cfg.googleFormUrl && cfg.googleFormUrl.includes("script.google.com")) {
    try {
      await fetch(cfg.googleFormUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(newIncident)
      });
    } catch (err) {
      console.warn("No se pudo enviar a Apps Script:", err);
    }
  }

  e.target.reset();
  if (tempPickMarker) {
    map.removeLayer(tempPickMarker);
    tempPickMarker = null;
  }
  document.getElementById("modal-report").classList.add("hidden");

  lastDataSignature = "";
  await loadAllData(false);
  map.flyTo([newIncident.lat, newIncident.lng], 16, { duration: 0.9 });

  showToast("Reporte publicado en el mapa en tiempo real");
}

// ============================================================================
// 9. UTILIDADES
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
