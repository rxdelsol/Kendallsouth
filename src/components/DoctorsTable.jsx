import React, { useEffect, useMemo, useState } from "react";
import {
  daysUntil,
  statusOf,
  STATUS_META,
  worseStatus,
  doctorCredentials,
} from "../utils/credStatus";

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
  const [detailFor, setDetailFor] = useState(null);

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
    if (!window.confirm("¿Actualizar TODOS los doctores desde el registro nacional NPPES?\nRefresca la taxonomía y rellena nombre/licencia faltantes. No borra tus datos.")) return;
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

  const anyFilter = search || fExp;

  return (
    <div className="bg-card rounded p-4">
      <h2 className="text-sky-200 font-semibold mb-2">Doctors</h2>

      {/* Tarjetas resumen */}
      <div className="ins-summary">
        <button className={`sum-tile ${fExp === "" ? "active" : ""}`} onClick={() => setFExp("")}>
          <span className="sum-num">{summary.total}</span><span className="sum-lbl">Doctores</span>
        </button>
        <button className={`sum-tile t-expired ${fExp === "expired" ? "active" : ""}`} onClick={() => setFExp(fExp === "expired" ? "" : "expired")}>
          <span className="sum-num">{summary.expired}</span><span className="sum-lbl">Con vencido</span>
        </button>
        <button className={`sum-tile t-30 ${fExp === "d30" ? "active" : ""}`} onClick={() => setFExp(fExp === "d30" ? "" : "d30")}>
          <span className="sum-num">{summary.d30}</span><span className="sum-lbl">≤ 30 días</span>
        </button>
        <button className={`sum-tile t-60 ${fExp === "d60" ? "active" : ""}`} onClick={() => setFExp(fExp === "d60" ? "" : "d60")}>
          <span className="sum-num">{summary.d60}</span><span className="sum-lbl">31–60 días</span>
        </button>
        <button className={`sum-tile t-nodate ${fExp === "nodate" ? "active" : ""}`} onClick={() => setFExp(fExp === "nodate" ? "" : "nodate")}>
          <span className="sum-num">{summary.nodate}</span><span className="sum-lbl">Datos incompletos</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="ins-filters">
        <input
          className="flt-search"
          placeholder="🔎 Buscar (nombre, NPI, licencia, CAQH…)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {anyFilter && (
          <button className="flt-clear" onClick={() => { setSearch(""); setFExp(""); }}>✕ Limpiar</button>
        )}
        <div style={{ flex: 1 }} />
        <button className="btn-red" onClick={refreshFromNppes} disabled={refreshing} title="Consulta el registro nacional NPPES y refresca todos los doctores">
          {refreshing ? "Actualizando…" : "🔄 Actualizar desde NPPES"}
        </button>
      </div>

      <p className="text-slate-400 text-xs mb-2">
        Mostrando {filtered.length} de {list.length} doctores
      </p>

      {refreshMsg && (refreshMsg.error ? (
        <p className="v-bad text-xs mb-2">No se pudo actualizar desde NPPES.</p>
      ) : (
        <p className="v-ok text-xs mb-2">
          ✓ Actualizados {refreshMsg.actualizado}/{refreshMsg.total} · no encontrados {refreshMsg.noEncontrado} · sin NPI {refreshMsg.sinNpi}{refreshMsg.error ? ` · errores ${refreshMsg.error}` : ""}
        </p>
      ))}

      <div className="overflow-auto mb-4">
        <table className="min-w-full text-sm">
          <thead className="text-slate-300">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">NPI</th>
              <th className="p-2">License</th>
              <th className="p-2">CAQH</th>
              <th className="p-2">Estado de credenciales</th>
              <th className="p-2">Próx. vence</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody className="text-slate-200">
            {filtered.map(({ d, creds, next }) => (
              <tr key={d.id} className="border-t border-slate-800">
                <td className="p-2">{d.name}</td>
                <td className="p-2">{d.npi}</td>
                <td className="p-2">{d.license}</td>
                <td className="p-2">{d.caqh}</td>
                <td className="p-2">
                  <div className="cred-pills">
                    {creds.map((c) => (
                      <span
                        key={c.key}
                        className={`sem-pill sem-mini ${STATUS_META[c.status].cls}`}
                        title={`${c.label}: ${c.date ? new Date(c.date).toLocaleDateString() + " · " + STATUS_META[c.status].label : "sin fecha"}`}
                      >
                        {abbr[c.key]}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-2 whitespace-nowrap">
                  {next ? (
                    <span className={`sem-pill ${STATUS_META[next.status].cls}`} title={next.label}>
                      {abbr[next.key]} {next.days}d
                    </span>
                  ) : (
                    <span className="text-slate-500 text-xs">—</span>
                  )}
                </td>
                <td className="p-2 space-x-3 whitespace-nowrap">
                  <button className="text-emerald-300 hover:underline" onClick={() => setDetailFor(d)}>Detalle</button>
                  <button className="text-sky-300 hover:underline" onClick={() => openEditModal(d)}>Edit</button>
                  <button className="text-red-500 hover:underline" onClick={() => remove(d.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-slate-400">
                  {list.length === 0 ? "No doctors added yet" : "Ningún doctor coincide con el filtro"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-left">
        <button onClick={openAddModal} className="text-sky-300 hover:underline text-sm">+ Add Doctor</button>
      </div>

      {/* Modal Detalle de credenciales */}
      {detailFor && (() => {
        const creds = doctorCredentials(detailFor).map((c) => ({ ...c, status: statusOf(c.date), days: daysUntil(c.date) }));
        return (
          <div className="modal-backdrop" onClick={() => setDetailFor(null)}>
            <div className="modal guide-modal" onClick={(e) => e.stopPropagation()}>
              <div className="guide-head">
                <div>
                  <h3 style={{ margin: 0 }}>{detailFor.name}</h3>
                  <div className="guide-sub">
                    NPI {detailFor.npi || "—"} · Licencia {detailFor.license || "—"} · CAQH {detailFor.caqh || "—"}
                    {detailFor.taxonomy ? ` · ${detailFor.taxonomy}` : ""}
                  </div>
                </div>
                <button className="btn-cancel" onClick={() => setDetailFor(null)}>Cerrar</button>
              </div>

              <table className="cred-detail">
                <thead>
                  <tr><th>Credencial</th><th>Vence</th><th>Estado</th><th>Acción</th></tr>
                </thead>
                <tbody>
                  {creds.map((c) => (
                    <tr key={c.key}>
                      <td>{c.label}{c.key === "caqh" && c.base ? ` (atestado ${new Date(c.base).toLocaleDateString()})` : ""}</td>
                      <td>{c.date ? new Date(c.date).toLocaleDateString() : "—"}</td>
                      <td>
                        <span className={`sem-pill ${STATUS_META[c.status].cls}`}>
                          {c.date ? `${c.days}d` : "sin fecha"}
                        </span>
                      </td>
                      <td className="cred-action">{c.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="guide-note">
                CAQH vence 120 días después de la última atestación. Medicare revalida cada 5 años (verifica tu fecha en CMS). Plazos pueden cambiar; confirma en cada portal.
              </p>
              <div className="mt-4 flex justify-end">
                <button className="btn-red" onClick={() => { setDetailFor(null); openEditModal(detailFor); }}>Editar fechas</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal guide-modal">
            <h3>{isEditing ? "Edit Doctor" : "Add Doctor"}</h3>

            <h4 className="form-section">Identificación</h4>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <input placeholder="Name" value={doctor.name} onChange={(e) => setDoctor({ ...doctor, name: e.target.value })} className="p-2 rounded bg-[#081424]" />
              <input placeholder="NPI" value={doctor.npi} onChange={(e) => setDoctor({ ...doctor, npi: e.target.value })} className="p-2 rounded bg-[#081424]" />
              <input placeholder="License #" value={doctor.license} onChange={(e) => setDoctor({ ...doctor, license: e.target.value })} className="p-2 rounded bg-[#081424]" />
              <input placeholder="CAQH #" value={doctor.caqh} onChange={(e) => setDoctor({ ...doctor, caqh: e.target.value })} className="p-2 rounded bg-[#081424]" />
              <input placeholder="Medicaid #" value={doctor.medicaid} onChange={(e) => setDoctor({ ...doctor, medicaid: e.target.value })} className="p-2 rounded bg-[#081424]" />
              <input placeholder="Medicare #" value={doctor.medicare} onChange={(e) => setDoctor({ ...doctor, medicare: e.target.value })} className="p-2 rounded bg-[#081424]" />
              <input placeholder="Taxonomy" value={doctor.taxonomy} onChange={(e) => setDoctor({ ...doctor, taxonomy: e.target.value })} className="p-2 rounded bg-[#081424]" />
              <label className="form-date"><span>DOB</span>
                <input type="date" value={doctor.dob || ""} onChange={(e) => setDoctor({ ...doctor, dob: e.target.value })} className="p-2 rounded bg-[#081424]" />
              </label>
            </div>

            <h4 className="form-section">Vencimientos de credenciales</h4>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <label className="form-date"><span>Licencia FL vence</span>
                <input type="date" value={doctor.licenseExp || ""} onChange={(e) => setDoctor({ ...doctor, licenseExp: e.target.value })} className="p-2 rounded bg-[#081424]" />
              </label>
              <input placeholder="DEA #" value={doctor.dea} onChange={(e) => setDoctor({ ...doctor, dea: e.target.value })} className="p-2 rounded bg-[#081424]" />
              <label className="form-date"><span>DEA vence</span>
                <input type="date" value={doctor.deaExp || ""} onChange={(e) => setDoctor({ ...doctor, deaExp: e.target.value })} className="p-2 rounded bg-[#081424]" />
              </label>
              <label className="form-date"><span>CAQH últ. atestación</span>
                <input type="date" value={doctor.caqhAttested || ""} onChange={(e) => setDoctor({ ...doctor, caqhAttested: e.target.value })} className="p-2 rounded bg-[#081424]" />
              </label>
              <label className="form-date"><span>Malpractice vence</span>
                <input type="date" value={doctor.malpracticeExp || ""} onChange={(e) => setDoctor({ ...doctor, malpracticeExp: e.target.value })} className="p-2 rounded bg-[#081424]" />
              </label>
              <label className="form-date"><span>Medicare revalidación</span>
                <input type="date" value={doctor.medicareRevalidation || ""} onChange={(e) => setDoctor({ ...doctor, medicareRevalidation: e.target.value })} className="p-2 rounded bg-[#081424]" />
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
