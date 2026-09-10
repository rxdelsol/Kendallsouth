import React, { useEffect, useMemo, useState } from "react";
import {
  daysUntil,
  statusOf,
  STATUS_META,
  worseStatus,
  doctorCredentials,
  EXTRA_CRED_PRESETS,
} from "../utils/credStatus";
import { deaCheck, DEA_STATE_META } from "../utils/dea";
import ProviderRecord from "./ProviderRecord.jsx";
import { PageHead } from "./Shell.jsx";
import "./styles/providers.css";

const iniciales = (n) =>
  String(n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

// Color del avatar derivado del nombre. Es identidad, no estado: ayuda a
// reencontrar a la misma persona al recorrer la lista, y por eso NO usa los
// colores del semáforo — esos significan vencimiento y no se prestan.
const TONOS = ["av-a", "av-b", "av-c", "av-d", "av-e", "av-f"];
const tonoDe = (n) => {
  let h = 0;
  for (let i = 0; i < String(n || "").length; i++) h = (h * 31 + n.charCodeAt(i)) % 997;
  return TONOS[h % TONOS.length];
};

const POR_PAGINA = [8, 15, 25, 50];

export default function DoctorsTable() {
  const empty = () => ({
    id: null,
    name: "",
    npi: "",
    license: "",
    caqh: "",
    medicaid: "",
    medicare: "",
    dob: "",
    taxonomy: "",
    // fechas de credenciales
    licenseExp: "",
    dea: "",
    deaExp: "",
    caqhAttested: "",
    malpracticeExp: "",
    medicareRevalidation: "",
    // permisos, entrenamientos y mantenimiento
    extraCreds: [],
  });

  const [list, setList] = useState([]);
  const [doctor, setDoctor] = useState(empty());
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  // La pantalla abre con alguien seleccionado: un panel vacío no muestra nada
  // de lo que la pantalla sabe hacer.
  const [picked, setPicked] = useState(null);

  const [search, setSearch] = useState("");
  const [fExp, setFExp] = useState(""); // "", expired, d30, d60, nodate
  const [fEsp, setFEsp] = useState("all");
  const [fRed, setFRed] = useState("all");
  const [seguros, setSeguros] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [porPag, setPorPag] = useState(8);
  const [ficha, setFicha] = useState(null); // doctor abierto en la ficha completa
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState(null);

  async function loadDoctors() {
    try {
      const res = await fetch("/api/get-doctors");
      const data = await res.json();
      if (data.ok) setList(data.data);
      else console.error(data.error);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadDoctors();
    fetch("/api/get-insurances")
      .then((r) => r.json())
      .then((d) => setSeguros(d && d.ok ? d.data || [] : []))
      .catch(() => {});
  }, []);

  async function refreshFromNppes() {
    if (!window.confirm("Refresh ALL providers from the national NPPES registry?\nUpdates taxonomy and fills in missing name/license. It does not delete your data.")) return;
    setRefreshing(true); setRefreshMsg(null);
    try {
      const res = await fetch("/api/refresh-doctors", { method: "POST" }).then((r) => r.json());
      if (res.ok) { await loadDoctors(); setRefreshMsg(res.summary); }
      else setRefreshMsg({ error: true });
    } catch (e) {
      setRefreshMsg({ error: true });
    } finally {
      setRefreshing(false);
    }
  }

  const saveDoctor = async () => {
    if (!doctor.name.trim()) return alert("Enter doctor name");
    try {
      const res = await fetch("/api/save-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doctor),
      });
      const data = await res.json();
      if (data.ok) {
        setShowModal(false);
        setDoctor(empty());
        setIsEditing(false);
        loadDoctors();
      } else {
        alert("Error saving doctor");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving doctor");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this doctor?")) return;
    try {
      const res = await fetch("/api/delete-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.ok) loadDoctors();
      else alert("Error deleting doctor");
    } catch (e) {
      console.error(e);
      alert("Error deleting doctor");
    }
  };

  const openAddModal = () => {
    setDoctor(empty());
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setDoctor({
      id: item.id,
      name: item.name,
      npi: item.npi || "",
      license: item.license || "",
      caqh: item.caqh || "",
      medicaid: item.medicaid || "",
      medicare: item.medicare || "",
      dob: item.dob ? item.dob.slice(0, 10) : "",
      taxonomy: item.taxonomy || "",
      licenseExp: item.licenseExp ? item.licenseExp.slice(0, 10) : "",
      dea: item.dea || "",
      deaExp: item.deaExp ? item.deaExp.slice(0, 10) : "",
      caqhAttested: item.caqhAttested ? item.caqhAttested.slice(0, 10) : "",
      malpracticeExp: item.malpracticeExp ? item.malpracticeExp.slice(0, 10) : "",
      medicareRevalidation: item.medicareRevalidation ? item.medicareRevalidation.slice(0, 10) : "",
      extraCreds: (Array.isArray(item.extraCreds) ? item.extraCreds : []).map((c) => ({
        label: c?.label || "",
        date: c?.date ? String(c.date).slice(0, 10) : "",
        action: c?.action || "",
      })),
    });
    setIsEditing(true);
    setShowModal(true);
  };

  // --- credenciales adicionales del formulario -----------------------------
  const addExtra = (c) =>
    setDoctor((d) => ({ ...d, extraCreds: [...(d.extraCreds || []), c] }));
  const setExtra = (i, patch) =>
    setDoctor((d) => {
      const xs = [...(d.extraCreds || [])];
      xs[i] = { ...xs[i], ...patch };
      return { ...d, extraCreds: xs };
    });
  const delExtra = (i) =>
    setDoctor((d) => ({ ...d, extraCreds: (d.extraCreds || []).filter((_, j) => j !== i) }));
  const addPreset = (label) => {
    const p = EXTRA_CRED_PRESETS.find((x) => x.label === label);
    if (p) addExtra({ label: p.label, date: "", action: p.action });
  };

  const abbr = { license: "Lic", dea: "DEA", caqh: "CAQH", malpractice: "Malp", medicare: "Mcr" };

  // Estado agregado por doctor + próxima credencial a vencer
  const withStatus = useMemo(() => {
    return list.map((d) => {
      const creds = doctorCredentials(d).map((c) => ({ ...c, status: statusOf(c.date), days: daysUntil(c.date) }));
      let worst = "ok";
      let missing = false;
      let next = null;
      creds.forEach((c) => {
        if (c.status === "nodate") { missing = true; return; }
        worst = worseStatus(worst, c.status);
        if (c.days !== null && (next === null || c.days < next.days)) next = c;
      });
      return { d, creds, worst, missing, next };
    });
  }, [list]);

  const summary = useMemo(() => {
    const s = { total: list.length, expired: 0, d30: 0, d60: 0, nodate: 0 };
    withStatus.forEach(({ creds, missing }) => {
      if (creds.some((c) => c.status === "expired")) s.expired++;
      if (creds.some((c) => c.status === "d30")) s.d30++;
      if (creds.some((c) => c.status === "d60")) s.d60++;
      if (missing) s.nodate++;
    });
    return s;
  }, [withStatus, list.length]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return withStatus.filter(({ d, creds, missing }) => {
      if (q) {
        const hay = [d.name, d.npi, d.license, d.caqh, d.medicaid, d.medicare, d.taxonomy]
          .map((x) => (x || "").toString().toLowerCase())
          .join(" ");
        if (!hay.includes(q)) return false;
      }
      if (fExp === "nodate") return missing;
      if (fExp) return creds.some((c) => c.status === fExp);
      return true;
    });
  }, [withStatus, search, fExp]);

  // Por urgencia: lo que vence antes va arriba. Sin fecha, al final —
  // no es urgente, es un dato que falta, y ya lo dice el horizonte.
  const seleccionado = useMemo(
    () => (picked ? list.find((d) => String(d.id) === String(picked.id)) || null : null),
    [picked, list]
  );

  const ordenados = useMemo(() => {
    const dias = (x) => {
      const v = x.creds.map((c) => c.days).filter((n) => n !== null && n !== undefined);
      return v.length ? Math.min(...v) : Infinity;
    };
    return [...filtered].sort((a, b) => dias(a) - dias(b));
  }, [filtered]);

  useEffect(() => {
    if (!picked && ordenados.length) setPicked(ordenados[0].d);
  }, [ordenados, picked]);

  // Red por proveedor: dentro de red si tiene al menos un contrato dentro.
  const redPorDoctor = useMemo(() => {
    const m = new Map();
    seguros.forEach((s) => {
      const k = (s.doctorName || "").trim();
      if (!k) return;
      const dentro = !String(s.network || "").toLowerCase().includes("out");
      m.set(k, (m.get(k) || false) || dentro);
    });
    return m;
  }, [seguros]);

  const especialidades = useMemo(
    () => Array.from(new Set(list.map((d) => (d.taxonomy || "").trim()).filter(Boolean))).sort(),
    [list]
  );

  const visibles = useMemo(() => {
    return ordenados.filter(({ d }) => {
      if (fEsp !== "all" && (d.taxonomy || "").trim() !== fEsp) return false;
      if (fRed !== "all") {
        const dentro = redPorDoctor.get((d.name || "").trim()) === true;
        if (fRed === "in" && !dentro) return false;
        if (fRed === "out" && dentro) return false;
      }
      return true;
    });
  }, [ordenados, fEsp, fRed, redPorDoctor]);

  const resumenRed = useMemo(() => {
    let dentro = 0;
    list.forEach((d) => { if (redPorDoctor.get((d.name || "").trim()) === true) dentro += 1; });
    return { dentro, fuera: list.length - dentro };
  }, [list, redPorDoctor]);

  // Paginar sin perder la página al filtrar es peor que reiniciarla: si filtro
  // y quedo en la página 5 de 2, la pantalla se ve vacía y parece un error.
  const paginas = Math.max(1, Math.ceil(visibles.length / porPag));
  const pagActual = Math.min(pagina, paginas);
  useEffect(() => { setPagina(1); }, [search, fExp, fEsp, fRed, porPag]);
  const enPagina = visibles.slice((pagActual - 1) * porPag, pagActual * porPag);
  const desde = visibles.length === 0 ? 0 : (pagActual - 1) * porPag + 1;
  const hasta = Math.min(pagActual * porPag, visibles.length);

  // Números de página con elipsis: 1 … 4 5 6 … 19. Mostrarlas todas con
  // muchos proveedores llena la fila y deja de servir para saltar.
  const numeros = useMemo(() => {
    const out = [];
    const cerca = (n) => n === 1 || n === paginas || Math.abs(n - pagActual) <= 1;
    for (let n = 1; n <= paginas; n++) {
      if (cerca(n)) out.push(n);
      else if (out[out.length - 1] !== "…") out.push("…");
    }
    return out;
  }, [paginas, pagActual]);

  const anyFilter = search || fExp || fEsp !== "all" || fRed !== "all";

  return (
    <div>
      <PageHead icono="doctors" titulo="Providers" sub="View and manage all providers">
        <button className="btn-pri" onClick={openAddModal}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          Add Provider
        </button>
      </PageHead>

      <div className="filterbar">
        <div className="flex flex-col gap-1">
          <label>Search</label>
          <input className="p-2 rounded ks-field text-sm" placeholder="Name, NPI, license, CAQH…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label>Specialty</label>
          <select className="p-2 rounded ks-field text-sm" value={fEsp} onChange={(e) => setFEsp(e.target.value)}>
            <option value="all">All</option>
            {especialidades.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label>Credential status</label>
          <select className="p-2 rounded ks-field text-sm" value={fExp} onChange={(e) => setFExp(e.target.value)}>
            <option value="">All</option>
            <option value="expired">Expired</option>
            <option value="d30">Expiring ≤ 30 days</option>
            <option value="d60">Expiring 31–60 days</option>
            <option value="nodate">Missing dates</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label>Network</label>
          <select className="p-2 rounded ks-field text-sm" value={fRed} onChange={(e) => setFRed(e.target.value)}>
            <option value="all">All</option>
            <option value="in">In Network</option>
            <option value="out">Out of Network</option>
          </select>
        </div>
      </div>

      {/* Las tarjetas son botones: además de contar, filtran. Un número que
          no lleva a la lista que lo produjo obliga a rearmar el filtro a mano. */}
      <div className="kpi-row">
        <button type="button" className={"kpi kpi-btn" + (!anyFilter ? " on" : "")} onClick={() => { setSearch(""); setFExp(""); setFEsp("all"); setFRed("all"); }}>
          <span className="kpi-ic acc"><svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></span>
          <span className="kpi-txt"><small>Total</small><b className="acc">{list.length}</b></span>
        </button>
        <button type="button" className={"kpi kpi-btn" + (fRed === "in" ? " on" : "")} onClick={() => setFRed(fRed === "in" ? "all" : "in")}>
          <span className="kpi-ic ok"><svg viewBox="0 0 24 24"><path d="M4 12.5l5.2 5L20 6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
          <span className="kpi-txt"><small>In network</small><b className="ok">{resumenRed.dentro}</b></span>
        </button>
        <button type="button" className={"kpi kpi-btn" + (fRed === "out" ? " on" : "")} onClick={() => setFRed(fRed === "out" ? "all" : "out")}>
          <span className="kpi-ic hot"><svg viewBox="0 0 24 24"><path d="M12 4l9 16H3zM12 10v4M12 17h.01" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
          <span className="kpi-txt"><small>Out of network</small><b className="hot">{resumenRed.fuera}</b></span>
        </button>
        <button type="button" className={"kpi kpi-btn" + (fExp === "d60" ? " on" : "")} onClick={() => setFExp(fExp === "d60" ? "" : "d60")}>
          <span className="kpi-ic mid"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></span>
          <span className="kpi-txt">
            <small>Expiring ≤ 60 days</small>
            <b className={summary.d30 + summary.d60 ? "mid" : ""}>{summary.d30 + summary.d60}</b>
            {summary.expired > 0 && <em>{summary.expired} expired</em>}
          </span>
        </button>
      </div>

      {refreshMsg && (refreshMsg.error ? (
        <p className="v-bad text-xs mb-2">Could not refresh from NPPES.</p>
      ) : (
        <p className="v-ok text-xs mb-2">
          ✓ Updated {refreshMsg.actualizado}/{refreshMsg.total} · not found {refreshMsg.noEncontrado} · without NPI {refreshMsg.sinNpi}
        </p>
      ))}

      <div className="panel">
        <div className="overflow-auto">
          <table className="prov-table">
            <thead>
              <tr>
                <th>Provider</th><th>NPI</th><th>Specialty</th><th>Network</th>
                <th>Next expiration</th><th className="num">Days left</th><th className="act">Actions</th>
              </tr>
            </thead>
            <tbody>
              {enPagina.map(({ d, next }) => {
                const dd = next && next.days !== null && next.days !== undefined ? next.days : null;
                const st = next ? next.status : "nodate";
                const cls = st === "expired" || st === "d30" ? "d-hot" : st === "d60" || st === "d90" ? "d-mid" : st === "ok" ? "d-ok" : "";
                const dentro = redPorDoctor.get((d.name || "").trim()) === true;
                return (
                  <tr key={d.id}>
                    <td>
                      <button type="button" className="prov-who" onClick={() => setFicha(d)} title="Open full record">
                        <span className={"prov-av " + tonoDe(d.name)}>{iniciales(d.name)}</span>
                        <span className="prov-nm">{d.name}{(!d.npi || !d.license) && <small>{!d.npi ? "no NPI on file" : "no license on file"}</small>}</span>
                      </button>
                    </td>
                    <td className="mono">{d.npi || "—"}</td>
                    <td className="q">{d.taxonomy || "—"}</td>
                    <td>{dentro ? <span className="badge-in">In Network</span> : <span className="badge-out">Out of Network</span>}</td>
                    <td className="mono">{next && next.date ? new Date(String(next.date).slice(0, 10) + "T00:00:00").toLocaleDateString() : "—"}</td>
                    <td className={"num mono " + cls}>{dd === null ? "—" : dd}</td>
                    <td className="act">
                      <button type="button" className="ic-btn" title="Open record" onClick={() => setFicha(d)}>
                        <svg viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" fill="none" stroke="currentColor" strokeWidth="1.7" /><circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>
                      </button>
                      <button type="button" className="ic-btn" title="Edit" onClick={() => openEditModal(d)}>
                        <svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16zM14.5 5.5l4 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                      <button type="button" className="ic-btn del" title="Delete" onClick={() => remove(d.id)}>
                        <svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V5h4v2M6.5 7l1 12h9l1-12M10 10.5v5M14 10.5v5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {enPagina.length === 0 && (
                <tr><td colSpan={7} className="prov-none">No provider matches the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pager">
          <span className="pager-txt">
            Showing {desde}–{hasta} of {visibles.length} provider{visibles.length === 1 ? "" : "s"}
          </span>
          <div className="pager-nums">
            <button type="button" className="pg-btn" disabled={pagActual === 1} onClick={() => setPagina(pagActual - 1)} aria-label="Previous page">‹</button>
            {numeros.map((n, i) =>
              n === "…" ? (
                <span key={"e" + i} className="pg-gap">…</span>
              ) : (
                <button key={n} type="button" className={"pg-btn" + (n === pagActual ? " on" : "")} aria-current={n === pagActual} onClick={() => setPagina(n)}>{n}</button>
              )
            )}
            <button type="button" className="pg-btn" disabled={pagActual === paginas} onClick={() => setPagina(pagActual + 1)} aria-label="Next page">›</button>
          </div>
          <label className="pager-size">
            <select className="ks-field text-sm" value={porPag} onChange={(e) => setPorPag(Number(e.target.value))}>
              {POR_PAGINA.map((n) => <option key={n} value={n}>{n} per page</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="prov-tools">
        <button className="flt-clear" onClick={refreshFromNppes} disabled={refreshing} title="Query the national NPPES registry and refresh every provider">
          {refreshing ? "Refreshing…" : "Refresh from NPPES"}
        </button>
        {anyFilter && <button className="flt-clear" onClick={() => { setSearch(""); setFExp(""); setFEsp("all"); setFRed("all"); }}>Clear filters</button>}
      </div>

      {/* Ficha completa del proveedor, sobre la tabla. La lista sigue detrás,
          así que cerrar devuelve a la misma página y el mismo filtro. */}
      {ficha && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setFicha(null); }}>
          <div className="modal modal-record" role="dialog" aria-label={`Record for ${ficha.name}`}>
            <button type="button" className="modal-x" onClick={() => setFicha(null)} aria-label="Close">×</button>
            <ProviderRecord inline doctor={ficha} onEdit={(d) => { setFicha(null); openEditModal(d); }} />
            <div className="dt-actions">
              <button className="flt-clear" onClick={() => { setFicha(null); openEditModal(ficha); }}>Edit</button>
              <button className="flt-clear dt-del" onClick={() => { remove(ficha.id); setFicha(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal guide-modal">
            <h3>{isEditing ? "Edit Doctor" : "Add Doctor"}</h3>

            <h4 className="form-section">Identification</h4>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <input placeholder="Name" value={doctor.name} onChange={(e) => setDoctor({ ...doctor, name: e.target.value })} className="p-2 rounded ks-field" />
              <input placeholder="NPI" value={doctor.npi} onChange={(e) => setDoctor({ ...doctor, npi: e.target.value })} className="p-2 rounded ks-field" />
              <input placeholder="License #" value={doctor.license} onChange={(e) => setDoctor({ ...doctor, license: e.target.value })} className="p-2 rounded ks-field" />
              <input placeholder="CAQH #" value={doctor.caqh} onChange={(e) => setDoctor({ ...doctor, caqh: e.target.value })} className="p-2 rounded ks-field" />
              <input placeholder="Medicaid #" value={doctor.medicaid} onChange={(e) => setDoctor({ ...doctor, medicaid: e.target.value })} className="p-2 rounded ks-field" />
              <input placeholder="Medicare #" value={doctor.medicare} onChange={(e) => setDoctor({ ...doctor, medicare: e.target.value })} className="p-2 rounded ks-field" />
              <input placeholder="Taxonomy" value={doctor.taxonomy} onChange={(e) => setDoctor({ ...doctor, taxonomy: e.target.value })} className="p-2 rounded ks-field" />
              <label className="form-date"><span>DOB</span>
                <input type="date" value={doctor.dob || ""} onChange={(e) => setDoctor({ ...doctor, dob: e.target.value })} className="p-2 rounded ks-field" />
              </label>
            </div>

            <h4 className="form-section">Vencimientos de credenciales</h4>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <label className="form-date"><span>Licencia FL vence</span>
                <input type="date" value={doctor.licenseExp || ""} onChange={(e) => setDoctor({ ...doctor, licenseExp: e.target.value })} className="p-2 rounded ks-field" />
              </label>
              <div>
                <input placeholder="DEA #" value={doctor.dea} onChange={(e) => setDoctor({ ...doctor, dea: e.target.value })} className="p-2 rounded ks-field" style={{ width: "100%" }} />
                {/* El vencimiento del DEA no es público (la DEA vende el archivo
                    por NTIS), pero que el número esté bien escrito sí se
                    comprueba acá mismo: dígito verificador e inicial del
                    apellido. Un DEA mal copiado termina en receta o claim
                    rechazado semanas después. */}
                {(() => {
                  const dc = deaCheck(doctor.dea, doctor.name);
                  if (dc.state === "empty") return null;
                  const meta = DEA_STATE_META[dc.state];
                  return (
                    <div className={meta.cls} style={{ fontSize: 11, marginTop: 3 }}>
                      {meta.icon} {dc.label}
                    </div>
                  );
                })()}
              </div>
              <label className="form-date"><span>DEA expires</span>
                <input type="date" value={doctor.deaExp || ""} onChange={(e) => setDoctor({ ...doctor, deaExp: e.target.value })} className="p-2 rounded ks-field" />
              </label>
              <label className="form-date"><span>CAQH last attestation</span>
                <input type="date" value={doctor.caqhAttested || ""} onChange={(e) => setDoctor({ ...doctor, caqhAttested: e.target.value })} className="p-2 rounded ks-field" />
              </label>
              <label className="form-date"><span>Malpractice expires</span>
                <input type="date" value={doctor.malpracticeExp || ""} onChange={(e) => setDoctor({ ...doctor, malpracticeExp: e.target.value })} className="p-2 rounded ks-field" />
              </label>
              <label className="form-date"><span>Medicare revalidation</span>
                <input type="date" value={doctor.medicareRevalidation || ""} onChange={(e) => setDoctor({ ...doctor, medicareRevalidation: e.target.value })} className="p-2 rounded ks-field" />
              </label>
            </div>

            {/* Permisos, entrenamientos y mantenimiento. Las cinco de arriba son
                del clínico; estas son de la operación y antes no cabían en
                ningún lado, así que vivían en una hoja aparte que nadie miraba.
                Se guardan como lista, no como columnas fijas: el día que
                aparezca bomberos o rayos X se agrega sin tocar la base. */}
            <h4 className="form-section">Otras credenciales</h4>
            <p className="form-hint">
              Permisos del local, entrenamientos anuales y mantenimiento de equipos.
              Salen en la ficha con el mismo semáforo y entran en el aviso por correo.
            </p>
            <div className="xc-list">
              {(doctor.extraCreds || []).map((c, i) => (
                <div className="xc-row" key={i}>
                  <input
                    className="p-2 rounded ks-field"
                    placeholder="Nombre — ej. Permiso de residuos biomédicos"
                    value={c.label || ""}
                    onChange={(e) => setExtra(i, { label: e.target.value })}
                  />
                  <input
                    type="date"
                    className="p-2 rounded ks-field"
                    value={c.date || ""}
                    onChange={(e) => setExtra(i, { date: e.target.value })}
                  />
                  <button
                    type="button"
                    className="xc-del"
                    onClick={() => delExtra(i)}
                    aria-label={`Quitar ${c.label || "credencial"}`}
                    title="Quitar"
                  >×</button>
                  <input
                    className="p-2 rounded ks-field xc-act"
                    placeholder="Qué hay que hacer para renovarla"
                    value={c.action || ""}
                    onChange={(e) => setExtra(i, { action: e.target.value })}
                  />
                </div>
              ))}
              {(doctor.extraCreds || []).length === 0 && (
                <p className="xc-none">Ninguna todavía.</p>
              )}
            </div>
            <div className="xc-add">
              <select
                className="ks-field text-sm"
                value=""
                onChange={(e) => { addPreset(e.target.value); e.target.value = ""; }}
                aria-label="Agregar credencial de la lista"
              >
                <option value="">Agregar de la lista…</option>
                {EXTRA_CRED_PRESETS.map((p) => (
                  <option key={p.label} value={p.label}>{p.label}</option>
                ))}
              </select>
              <button type="button" className="flt-clear" onClick={() => addExtra({ label: "", date: "", action: "" })}>
                Agregar en blanco
              </button>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-cancel" onClick={() => { setShowModal(false); setIsEditing(false); setDoctor(empty()); }}>Cancel</button>
              <button className="btn-red" onClick={saveDoctor}>{isEditing ? "Save Changes" : "Save Doctor"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
