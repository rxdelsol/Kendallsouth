// api/trial-search.js
//
// Busca estudios que están reclutando en Florida en ClinicalTrials.gov y
// devuelve lo que hace falta para decidir si vale la pena aplicar: patrocinador,
// fase, condición, cuántos sitios, y a quién se le escribe.
//
// Va por el servidor y no desde el navegador por dos razones. Una, el navegador
// tendría que confiar en el CORS de un tercero que puede cambiar sin avisar.
// Dos, acá se puede normalizar la respuesta: la API v2 devuelve un objeto
// grande y anidado, y mandarlo entero al front sería mover medio megabyte para
// pintar quince filas.
//
// No necesita ninguna clave: la API de ClinicalTrials.gov es abierta.
//
// Parámetros (todos opcionales):
//   q       texto libre — condición, fármaco, patrocinador
//   phase   PHASE1 | PHASE2 | PHASE3 | PHASE4
//   status  RECRUITING (por defecto) | NOT_YET_RECRUITING | ambos con coma
//   state   por defecto Florida
//   page    cursor devuelto por la llamada anterior

const BASE = "https://clinicaltrials.gov/api/v2/studies";

const CAMPOS = [
  "protocolSection.identificationModule",
  "protocolSection.statusModule",
  "protocolSection.sponsorCollaboratorsModule",
  "protocolSection.conditionsModule",
  "protocolSection.designModule",
  "protocolSection.contactsLocationsModule",
].join(",");

// Un estudio con 300 sitios ya repartidos rara vez sigue abriendo sitios
// nuevos. No se esconde, pero se marca, porque aplicar a ése es gastar una
// tarde.
const MUCHOS_SITIOS = 120;

function limpiar(s) {
  const p = s?.protocolSection || {};
  const id = p.identificationModule || {};
  const st = p.statusModule || {};
  const sp = p.sponsorCollaboratorsModule || {};
  const co = p.conditionsModule || {};
  const de = p.designModule || {};
  const cl = p.contactsLocationsModule || {};

  const sitios = Array.isArray(cl.locations) ? cl.locations : [];
  const enFlorida = sitios.filter((l) => /florida|^FL$/i.test(String(l.state || "")));

  // Contacto central: es el camino real para pedir ser sitio. Si no hay, queda
  // el enlace del registro y se dice que no hay contacto, en vez de inventar
  // un correo genérico del patrocinador.
  const contactos = (cl.centralContacts || []).map((c) => ({
    name: c.name || "",
    role: c.role || "",
    phone: c.phone || "",
    email: c.email || "",
  }));

  return {
    nct: id.nctId || "",
    title: id.briefTitle || "",
    official: id.officialTitle || "",
    sponsor: sp.leadSponsor?.name || "",
    collaborators: (sp.collaborators || []).map((c) => c.name).slice(0, 4),
    status: st.overallStatus || "",
    startDate: st.startDateStruct?.date || "",
    completion: st.primaryCompletionDateStruct?.date || "",
    lastUpdate: st.lastUpdatePostDateStruct?.date || "",
    conditions: (co.conditions || []).slice(0, 6),
    phases: (de.phases || []).map((f) => f.replace("PHASE", "Phase ").replace("NA", "N/A")),
    enrollment: de.enrollmentInfo?.count ?? null,
    siteCount: sitios.length,
    floridaSites: enFlorida.map((l) => [l.facility, l.city].filter(Boolean).join(" · ")).slice(0, 6),
    crowded: sitios.length >= MUCHOS_SITIOS,
    contacts: contactos,
    url: id.nctId ? `https://clinicaltrials.gov/study/${id.nctId}` : "",
  };
}

export default async function handler(req, res) {
  try {
    const { q = "", phase = "", status = "RECRUITING", state = "Florida", page = "" } = req.query || {};

    const u = new URL(BASE);
    u.searchParams.set("format", "json");
    u.searchParams.set("pageSize", "40");
    u.searchParams.set("countTotal", "true");
    u.searchParams.set("fields", CAMPOS);
    u.searchParams.set("query.locn", String(state));
    u.searchParams.set("filter.overallStatus", String(status));
    // Los que cambiaron algo hace poco primero: un registro actualizado la
    // semana pasada es un estudio vivo; uno intacto desde hace dos años suele
    // ser un registro que nadie mantiene.
    u.searchParams.set("sort", "LastUpdatePostDate:desc");
    if (q) u.searchParams.set("query.term", String(q));
    if (phase) u.searchParams.set("filter.advanced", `AREA[Phase]${String(phase)}`);
    if (page) u.searchParams.set("pageToken", String(page));

    // Si el registro rechaza la consulta, casi siempre es por uno de los dos
    // parámetros finos: el filtro de fase o el orden. Se reintenta sin ellos
    // antes de darse por vencido — una búsqueda sin ordenar sirve; una pantalla
    // en blanco porque cambió el nombre de un parámetro, no.
    let r = await fetch(u, { headers: { Accept: "application/json" } });
    let degradada = false;
    if (!r.ok && (u.searchParams.has("filter.advanced") || u.searchParams.has("sort"))) {
      u.searchParams.delete("filter.advanced");
      u.searchParams.delete("sort");
      r = await fetch(u, { headers: { Accept: "application/json" } });
      degradada = r.ok;
    }
    if (!r.ok) {
      const cuerpo = await r.text().catch(() => "");
      return res.status(502).json({
        ok: false,
        error: `ClinicalTrials.gov respondió ${r.status}`,
        detail: cuerpo.slice(0, 300),
      });
    }
    const data = await r.json();

    return res.status(200).json({
      ok: true,
      // Cuando esto viene en true, el filtro de fase no se aplicó: la pantalla
      // lo dice en vez de enseñar resultados de todas las fases como si fueran
      // los pedidos.
      degraded: degradada,
      total: data.totalCount ?? null,
      nextPage: data.nextPageToken || null,
      studies: (data.studies || []).map(limpiar),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
