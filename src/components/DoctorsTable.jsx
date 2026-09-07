import React, { useEffect, useMemo, useState } from "react";
import {
  daysUntil,
  statusOf,
  STATUS_META,
  worseStatus,
  doctorCredentials,
} from "../utils/credStatus";
import { deaCheck, DEA_STATE_META } from "../utils/dea";
import ProviderRecord from "./ProviderRecord.jsx";
import CredentialHorizon from "./CredentialHorizon.jsx";

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
    });
    setIsEditing(true);
    setShowModal(true);
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

  const anyFilter = search || fExp;

  return (
    <div className="ks-card rounded p-4">
      <h2 className="ks-accent font-semibold mb-2">Doctors</h2>

      {/* Tarjetas resumen */}
      <div className="ins-summary">
        <button className={`sum-tile ${fExp === "" ? "active" : ""}`} onClick={() => setFExp("")}>
          <span className="sum-num">{summary.total}</span><span className="sum-lbl">Providers</span>
        </button>
        <button className={`sum-tile t-expired ${fExp === "expired" ? "active" : ""}`} onClick={() => setFExp(fExp === "expired" ? "" : "expired")}>
          <span className="sum-num">{summary.expired}</span><span className="sum-lbl">Expired</span>
        </button>
        <button className={`sum-tile t-30 ${fExp === "d30" ? "active" : ""}`} onClick={() => setFExp(fExp === "d30" ? "" : "d30")}>
          <span className="sum-num">{summary.d30}</span><span className="sum-lbl">≤ 30 days</span>
        </button>
        <button className={`sum-tile t-60 ${fExp === "d60" ? "active" : ""}`} onClick={() => setFExp(fExp === "d60" ? "" : "d60")}>
          <span className="sum-num">{summary.d60}</span><span className="sum-lbl">31–60 days</span>
        </button>
        <button className={`sum-tile t-nodate ${fExp === "nodate" ? "active" : ""}`} onClick={() => setFExp(fExp === "nodate" ? "" : "nodate")}>
          <span className="sum-num">{summary.nodate}</span><span className="sum-lbl">Incomplete data</span>
        </button>
      </div>

      <CredentialHorizon
        doctors={list}
        selectedId={seleccionado?.id}
        onPick={(d) => setPicked(d)}
      />

      {/* Filtros */}
      <div className="ins-filters">
        <input
          className="flt-search"
          placeholder="🔎 Search (name, NPI, license, CAQH…)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {anyFilter && (
          <button className="flt-clear" onClick={() => { setSearch(""); setFExp(""); }}>✕ Clear</button>
        )}
        <div style={{ flex: 1 }} />
        <button className="btn-red" onClick={refreshFromNppes} disabled={refreshing} title="Consulta el registro nacional NPPES y refresca todos los doctores">
          {refreshing ? "Actualizando…" : "🔄 Refresh from NPPES"}
        </button>
      </div>

      <p className="ks-muted text-xs mb-2">
        Showing {ordenados.length} of {list.length} providers · sorted by what comes due first
      </p>

      {refreshMsg && (refreshMsg.error ? (
        <p className="v-bad text-xs mb-2">No se pudo actualizar desde NPPES.</p>
      ) : (
        <p className="v-ok text-xs mb-2">
          ✓ Actualizados {refreshMsg.actualizado}/{refreshMsg.total} · no encontrados {refreshMsg.noEncontrado} · sin NPI {refreshMsg.sinNpi}{refreshMsg.error ? ` · errores ${refreshMsg.error}` : ""}
        </p>
      ))}

      <div className="dt-split">
        <aside className="dt-queue">
          <div className="dt-queue-head">
            <span className="dt-eyebrow">By urgency</span>
            <span>{ordenados.length} of {list.length}</span>
          </div>
          {ordenados.map(({ d, next }) => {
            const dd = next && next.days !== null && next.days !== undefined ? next.days : null;
            const t = dd === null ? "none" : dd <= 30 ? "hot" : dd <= 90 ? "mid" : "ok";
            const activo = seleccionado && String(seleccionado.id) === String(d.id);
            return (
              <button key={d.id} type="button" className="dt-qitem" aria-current={activo} onClick={() => setPicked(d)}>
                <span className={`dt-qdays c-${t}`}>
                  {dd === null ? "\u2014" : dd}
                  <small>{dd === null ? "no date" : "days"}</small>
                </span>
                <span className="dt-qname">
                  <b>{d.name}</b>
                  <small>{d.taxonomy || "No taxonomy"}</small>
                </span>
              </button>
            );
          })}
          {ordenados.length === 0 && <p className="dt-empty">No provider matches the filter</p>}
        </aside>

        <div className="dt-record">
          {seleccionado ? (
            <>
              <ProviderRecord inline doctor={seleccionado} onEdit={(d) => openEditModal(d)} />
              <div className="dt-actions">
                <button className="flt-clear" onClick={() => openEditModal(seleccionado)}>Edit</button>
                <button className="flt-clear dt-del" onClick={() => remove(seleccionado.id)}>Delete</button>
              </div>
            </>
          ) : (
            <p className="dt-empty">Select a provider to open their record.</p>
          )}
        </div>
      </div>

      <div className="mt-3">
        <button onClick={openAddModal} className="ks-accent hover:underline text-sm">+ Add Doctor</button>
      </div>

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
