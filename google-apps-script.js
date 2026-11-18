/**
 * SCRIPT OPCIONAL PARA GOOGLE SHEETS (Extensiones -> Apps Script)
 * -------------------------------------------------------------------
 * Nota: CartaVial ya puede leer tu Google Sheet directamente sin necesidad de este script
 * usando el endpoint público /gviz/tq?tqx=out:json con solo compartir la hoja como
 * "Cualquier persona con el enlace (Lector)".
 *
 * Sin embargo, si quieres que el formulario integrado dentro de la página web también
 * guarde filas directamente en tu Google Sheet sin salir del mapa:
 * 1. En tu Google Sheet ve a: Extensiones -> Apps Script
 * 2. Pega este código, haz clic en "Implementar -> Nueva implementación"
 * 3. Elige tipo "Aplicación web", Ejecutar como "Yo", Quién tiene acceso: "Cualquier persona"
 * 4. Copia la URL generada y pégala en el botón "⚙️ Sheets" de CartaVial.
 */

function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const data = rows.slice(1).map((row, idx) => ({
    id: "sheet-" + idx,
    fecha: String(row[0] || ""),
    tipo: String(row[1] || "Choque"),
    sector: String(row[2] || "Cartagena"),
    mapsUrl: String(row[3] || "")
  }));

  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const body = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date().toLocaleString("es-CO"),
    body.tipo || "Choque",
    body.sector || "Cartagena",
    body.mapsUrl || ""
  ]);

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
