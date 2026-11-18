# 🚨 CartaVial — Inteligencia ciudadana para movernos mejor (MVP)

**CartaVial** es un mapa interactivo colaborativo (*crowdsourcing*) y de **datos abiertos** para reportar y visualizar incidentes viales en tiempo real en **Cartagena de Indias** (Avenida Pedro de Heredia, Vía Mamonal, Bomba El Amparo, Pie de la Popa, El Bosque, Centro, etc.).

---

## ✨ ¿Qué incluye este MVP?

1. **Mapa interactivo centrado en Cartagena (`OpenStreetMap` + `Leaflet`)**:
   - Pines diferenciados por color e ícono para los 3 problemas viales del proyecto:
     - 💥 **Choque** (Rojo)
     - 🚧 **Vía cerrada** (Naranja)
     - 🚦 **Semáforo dañado** (Amarillo)
   - Filtros superiores con contador en vivo y botones de salto rápido a los corredores críticos (*Av. Pedro de Heredia*, *Mamonal*, *El Amparo / Ronda Real*, *Centro / Getsemaní*).
2. **Botón flotante `"🚨 Reportar incidente"`**:
   - Abre un formulario ultrarrápido de **3 preguntas**:
     1. **Tipo de problema** (*Choque*, *Vía cerrada*, *Semáforo dañado*).
     2. **Barrio o sector** (con autocompletado de barrios de Cartagena).
     3. **Enlace de ubicación de Google Maps** (puedes pegar el link de Google Maps, tocar **"📍 Generar link con mi GPS"** o **"🗺️ Elegir punto en el mapa"**).
   - Al enviarlo, el marcador aparece inmediatamente en el mapa.
3. **Conexión en vivo con `Google Forms` + `Google Sheets` (JSON público)**:
   - Lee automáticamente cualquier hoja de Google Sheets compartida como pública mediante el endpoint `/gviz/tq?tqx=out:json` (o CSV publicado en la web).
   - Incluye un visor y descargador de **Datos Abiertos (`{ } JSON`)** en la barra superior.

---

## 🛠️ Guía Paso a Paso según tu Plan de Ejecución

### Paso 1 (Días 1–3): Conectar tu Google Form y Google Sheets en 3 minutos

1. Ve a [Google Forms](https://forms.google.com) y crea un formulario nuevo llamado **"Reporte Ciudadano - CartaVial"**.
2. Crea exactamente estas **3 preguntas**:
   - **Pregunta 1 (Varias opciones):** `Tipo de problema`
     - Opciones: `Choque`, `Vía cerrada`, `Semáforo dañado`
   - **Pregunta 2 (Respuesta corta):** `Barrio o sector`
   - **Pregunta 3 (Respuesta corta):** `Enlace de ubicación de Google Maps`
3. En la pestaña **Respuestas** del formulario, haz clic en **"Vincular con Hojas de cálculo"** para crear el Google Sheet.
4. Dentro del Google Sheet recién creado:
   - Haz clic en el botón **Compartir** (arriba a la derecha).
   - En *Acceso general*, cámbialo a **"Cualquier persona con el enlace"** (rol **Lector**).
   - Copia el enlace de tu Google Sheet.
5. En **CartaVial**:
   - Haz clic en el botón **`⚙️ Sheets`** arriba a la derecha (o pega el link directamente en la constante `DEFAULT_CONFIG.googleSheetUrl` dentro de `app.js`).

---

### Paso 2 (Día 6): Subir a GitHub Pages gratis

1. Crea un repositorio público nuevo en [GitHub](https://github.com/new) llamado `cartavial`.
2. Sube los archivos de esta carpeta:
   - `index.html`
   - `styles.css`
   - `app.js`
   - carpeta `data/incidentes.json`
3. En tu repositorio de GitHub ve a **Settings → Pages**.
4. En **Branch**, selecciona `main` (carpeta `/root`) y dale a **Save**.
5. ¡En 1 minuto tendrás tu enlace público `https://tu-usuario.github.io/cartavial/` listo para compartir por WhatsApp con tus compañeros!
