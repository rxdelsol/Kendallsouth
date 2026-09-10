import React, { useMemo, useState } from "react";
import { addDays, daysUntil, statusOf, STATUS_META } from "../utils/credStatus";
import { PageHead } from "./Shell.jsx";
import {
  SITE, PHASES, STARTUP, AREAS, CAPABILITIES, DIVERSITY, TEAM, SITE_DOCS, STUDIES, ACTIVE_STUDIES,
} from "../data/research.js";
import "./styles/research.css";

// La sección de investigación clínica: el perfil que ven los sponsors y, al
// lado, lo que de verdad decide si el sitio puede abrir un estudio — la CV
// firmada y el GCP de cada persona.
//
// Las dos cosas viven en la misma pantalla a propósito. El perfil es lo que el
// sitio dice que puede hacer; los vencimientos son lo que puede probar. Cuando
// se miran por separado es fácil declarar catorce áreas terapéuticas con dos
// GCP vencidos abajo, y eso es exactamente lo que un monitor encuentra en la
// primera visita.

// Una CV no vence el día que se firma: los sponsors piden que se vuelva a
// firmar cada dos años. Lo que hay que vigilar es esa fecha, no la firma, así
// que la columna muestra la firma y el semáforo mide la re-firma. Medir la
// firma pintaba de rojo a todo el equipo el día siguiente y no significaba nada.
const CV_VALID_DAYS = 730;
const cvDue = (d) => (d ? addDays(d, CV_VALID_DAYS) : null);

const fmt = (d) =>
  !d ? "—" :
  new Date(String(d).slice(0, 10) + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "2-digit",
  });

function Pill({ date }) {
  const st = statusOf(date);
  const meta = STATUS_META[st];
  const d = daysUntil(date);
  const texto = st === "nodate" ? "No date" : st === "expired" ? `${Math.abs(d)}d over` : `${d}d`;
  return <span className={`sem-pill sem-mini ${meta.cls}`} title={meta.label}>{texto}</span>;
}

const TABS = [
  { id: "active", label: "Active studies" },
  { id: "team", label: "Research team" },
  { id: "profile", label: "Site profile" },
  { id: "capabilities", label: "Capabilities" },
  { id: "studies", label: "Trial history" },
  { id: "docs", label: "Site documents" },
];

export default function Research() {
  const [tab, setTab] = useState("active");
  const [q, setQ] = useState("");
  const [fase, setFase] = useState("all");
  const [verBajas, setVerBajas] = useState(false);

  // El resumen de arriba cuenta lo mismo que las filas de abajo. Si dijera
  // "todo en orden" mientras una fila está en rojo, la pantalla estaría
  // mintiendo con números, que es la peor forma de mentir.
  const activos = useMemo(() => TEAM.filter((p) => p.active), []);
  const bajas = useMemo(() => TEAM.filter((p) => !p.active), []);

  const resumen = useMemo(() => {
    let vencidos = 0, pronto = 0, sinFecha = 0;
    activos.forEach((p) => {
      [cvDue(p.cv), p.gcp].forEach((f) => {
        const s = statusOf(f);
        if (s === "expired") vencidos++;
        else if (s === "d30" || s === "d60" || s === "d90") pronto++;
        else if (s === "nodate") sinFecha++;
      });
    });
    return { vencidos, pronto, sinFecha };
  }, [activos]);

  const equipo = useMemo(() => {
    const t = q.trim().toLowerCase();
    const base = verBajas ? TEAM : activos;
    const filas = t
      ? base.filter((p) => (p.name + " " + p.role).toLowerCase().includes(t))
      : base.slice();
    // Lo vencido primero: el orden de la lista es el orden en que hay que
    // atenderla, no el alfabético.
    const peso = { expired: 0, d30: 1, d60: 2, d90: 3, nodate: 4, ok: 5 };
    return filas.sort((a, b) => {
      const pa = Math.min(peso[statusOf(cvDue(a.cv))], peso[statusOf(a.gcp)]);
      const pb = Math.min(peso[statusOf(cvDue(b.cv))], peso[statusOf(b.gcp)]);
      // Los que ya no están van al final aunque tengan algo vencido: es
      // historial, no trabajo pendiente.
      if (a.active !== b.active) return a.active ? -1 : 1;
      return pa - pb || a.name.localeCompare(b.name);
    });
  }, [q, verBajas, activos]);

  const estudios = useMemo(() => {
    const t = q.trim().toLowerCase();
    return STUDIES.filter((s) => {
      if (fase !== "all" && s.phase !== fase) return false;
      if (!t) return true;
      return (s.protocol + " " + s.nct + " " + s.sponsor + " " + s.title).toLowerCase().includes(t);
    });
  }, [q, fase]);

  const fases = useMemo(() => {
    const set = new Set(STUDIES.map((s) => s.phase).filter(Boolean));
    return Array.from(set).sort();
  }, []);

  const sponsors = useMemo(() => new Set(STUDIES.map((s) => s.sponsor).filter(Boolean)).size, []);

  return (
    <div className="rs">
      <PageHead
        icono="research"
        titulo="Research"
        sub="Clinical trial site profile, research team credentials and study history"
      />

      <div className="rs-idcard">
        <div>
          <h3>{SITE.name}</h3>
          <p className="rs-addr">{SITE.address}</p>
          <p className="rs-type">{SITE.type}</p>
        </div>
        <div className="rs-ids">
          <div><span className="rs-k">Site PIN</span><span className="mono">{SITE.sitePin}</span></div>
          <div><span className="rs-k">NPI</span><span className="mono">{SITE.npi}</span></div>
          <div><span className="rs-k">Tax ID</span><span className="mono">{SITE.taxId}</span></div>
          <div><span className="rs-k">Phone</span><span className="mono">{SITE.phone}</span></div>
        </div>
      </div>

      <div className="ins-summary">
        <div className={`sum-tile t-expired ${resumen.vencidos ? "" : "quiet"}`}>
          <span className="sum-num">{resumen.vencidos}</span>
          <span className="sum-lbl">Expired</span>
        </div>
        <div className="sum-tile t-60">
          <span className="sum-num">{resumen.pronto}</span>
          <span className="sum-lbl">≤ 90 days</span>
        </div>
        <div className="sum-tile t-nodate">
          <span className="sum-num">{resumen.sinFecha}</span>
          <span className="sum-lbl">No date on file</span>
        </div>
        <div className="sum-tile t-active">
          <span className="sum-num">{ACTIVE_STUDIES.length}</span>
          <span className="sum-lbl">Open studies</span>
        </div>
        <div className="sum-tile">
          <span className="sum-num">{activos.length}</span>
          <span className="sum-lbl">On the delegation log</span>
        </div>
        <div className="sum-tile">
          <span className="sum-num">{STUDIES.length}</span>
          <span className="sum-lbl">Studies run</span>
        </div>
        <div className="sum-tile">
          <span className="sum-num">{sponsors}</span>
          <span className="sum-lbl">Sponsors</span>
        </div>
      </div>

      <div className="rs-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`rs-tab ${tab === t.id ? "on" : ""}`}
            onClick={() => { setTab(t.id); setQ(""); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Estudios abiertos ──────────────────────────────────────────── */}
      {tab === "active" && (
        <section className="ks-card rs-card">
          <h4 className="rs-h">Open at the site</h4>
          <p className="rs-sub">
            The studies currently running. None of them is in Studies.docx, which stops at 2023 —
            that file is history, this list is the work. Investigator and protocol version come
            from the site's regulatory binder, not from the RESEARCH folder, so they start empty:
            those two are the first things a monitor checks, and a plausible-looking guess there
            is worse than a blank.
          </p>
          <div className="rs-open">
            {ACTIVE_STUDIES.map((s2) => (
              <div className={`rs-openrow ${s2.sponsor ? "" : "gap"}`} key={s2.protocol}>
                <div className="rs-openhd">
                  <b className="mono">{s2.protocol}</b>
                  {s2.phase ? <span className="rs-phase">{s2.phase}</span> : <span className="rs-phase gapped">Phase unknown</span>}
                  {s2.nct ? (
                    <a className="mono" href={`https://clinicaltrials.gov/study/${s2.nct}`} target="_blank" rel="noopener noreferrer">
                      {s2.nct} ↗
                    </a>
                  ) : null}
                </div>
                <span className="rs-sponsor">{s2.sponsor || "Sponsor not on file"}</span>
                {s2.title ? <p className="rs-otitle">{s2.title}</p> : null}

                <div className="rs-ometa">
                  <div className="rs-meta">
                    <span className="rs-k">Principal investigator</span>
                    {s2.pi
                      ? <span>{s2.pi}</span>
                      : <span className="rs-todo">Not on file — from the delegation log</span>}
                  </div>
                  <div className="rs-meta">
                    <span className="rs-k">Sub-investigators</span>
                    {s2.subs && s2.subs.length
                      ? <span>{s2.subs.join(" · ")}</span>
                      : <span className="rs-todo">Not on file — from the delegation log</span>}
                  </div>
                  <div className="rs-meta">
                    <span className="rs-k">Protocol in use</span>
                    {s2.version
                      ? <span className="mono">{s2.version}{s2.versionDate ? ` · ${fmt(s2.versionDate)}` : ""}</span>
                      : <span className="rs-todo">Not on file — from the regulatory binder</span>}
                  </div>
                </div>

                {s2.note ? <p className="rs-onote">{s2.note}</p> : null}
                {s2.src ? <span className="rs-osrc">Source: {s2.src}</span> : null}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Equipo ─────────────────────────────────────────────────────── */}
      {tab === "team" && (
        <section className="ks-card rs-card">
          <div className="rs-tools">
            <input
              className="flt-search"
              placeholder="Search the team by name or role…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <label className="rs-toggle">
              <input type="checkbox" checked={verBajas} onChange={(e) => setVerBajas(e.target.checked)} />
              Show {bajas.length} former staff
            </label>
            <span className="rs-hint">
              The counters above cover only people on the delegation log. GCP is measured from the
              certificate — NIDA CTN and TransCelerate last three years. The CV light is measured
              two years from the signature, which is what sponsors ask for, and a year in a file
              name is not a signature.
            </span>
          </div>

          <div className="rs-scroll">
            <table className="rs-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Role</th>
                  <th>CV signed · re-sign due</th>
                  <th>GCP expires</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {equipo.map((p) => (
                  <tr key={p.name} className={p.active ? "" : "rs-off"}>
                    <td>
                      <b>{p.name}</b>
                      {p.active ? null : <small className="rs-tag">Former staff</small>}
                      {p.license ? <small className="mono">{p.license}</small> : null}
                      {p.warn ? <small className="rs-warn">⚠ {p.warn}</small> : null}
                    </td>
                    <td className="rs-role">{p.role}</td>
                    <td className="rs-when">
                      <span>{fmt(p.cv)}</span> <Pill date={cvDue(p.cv)} />
                      {p.cv ? <small>due {fmt(cvDue(p.cv))}</small> : null}
                    </td>
                    <td className="rs-when">
                      <span>{fmt(p.gcp)}</span> <Pill date={p.gcp} />
                    </td>
                    <td className="rs-src">
                      <span>{p.cvSrc}</span>
                      <span>{p.gcpSrc}</span>
                      {p.extra ? <span>{p.extra}</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Perfil ─────────────────────────────────────────────────────── */}
      {tab === "profile" && (
        <>
          <section className="ks-card rs-card">
            <h4 className="rs-h">Trial phases of interest</h4>
            <p className="rs-sub">The site asks to be notified about trials in these phases.</p>
            <div className="rs-chips">
              {PHASES.map((p) => <span className="rs-chip on" key={p}>{p}</span>)}
            </div>
          </section>

          <section className="ks-card rs-card">
            <h4 className="rs-h">Study start-up</h4>
            <div className="rs-startup">
              {STARTUP.map((s) => (
                <div className="rs-metric" key={s.n + s.u}>
                  <span className="n">{s.n}</span>
                  <span className="u">{s.u}</span>
                  <span className="d">{s.d}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="ks-card rs-card">
            <h4 className="rs-h">Disease areas of interest</h4>
            <p className="rs-sub">What the site is notified about, grouped by therapeutic area.</p>
            {AREAS.map((a) => (
              <div className="rs-area" key={a.area}>
                <div className="rs-areahd">
                  <span>{a.area}</span>
                  <span className="mono">{a.terms.length}</span>
                </div>
                <div className="rs-chips">
                  {a.terms.map((t) => <span className="rs-chip" key={t}>{t}</span>)}
                </div>
              </div>
            ))}
          </section>

          <section className="ks-card rs-card">
            <h4 className="rs-h">Population at the site</h4>
            <p className="rs-sub">
              Share of the site's own patients. Sponsors read this as recruitment reach for
              diversity plans, so it is worth keeping current rather than accurate once.
            </p>
            <div className="rs-diversity">
              <div>
                <h5>Ethnicity</h5>
                {DIVERSITY.ethnicity.map((r) => (
                  <div className="rs-bar" key={r.label}>
                    <span className="rs-barlbl">{r.label}</span>
                    <span className="rs-bartrack"><i style={{ width: `${r.pct}%` }} /></span>
                    <span className="rs-barpct mono">{r.pct}%</span>
                  </div>
                ))}
              </div>
              <div>
                <h5>Race</h5>
                {DIVERSITY.race.map((r) => (
                  <div className="rs-bar" key={r.label}>
                    <span className="rs-barlbl">{r.label}</span>
                    <span className="rs-bartrack"><i style={{ width: `${r.pct}%` }} /></span>
                    <span className="rs-barpct mono">{r.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── Capacidades ────────────────────────────────────────────────── */}
      {tab === "capabilities" && (
        <>
          {CAPABILITIES.map((c) => (
            <section className="ks-card rs-card" key={c.group}>
              <h4 className="rs-h">{c.group} <span className="mono rs-count">{c.items.length}</span></h4>
              <div className="rs-caps">
                {c.items.map((i) => <span className="rs-cap" key={i}>{i}</span>)}
              </div>
            </section>
          ))}
        </>
      )}

      {/* ── Historial de estudios ──────────────────────────────────────── */}
      {tab === "studies" && (
        <section className="ks-card rs-card">
          <div className="rs-tools">
            <input
              className="flt-search"
              placeholder="Search by protocol, NCT, sponsor or title…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select value={fase} onChange={(e) => setFase(e.target.value)}>
              <option value="all">All phases</option>
              {fases.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <span className="rs-hint">
              {estudios.length} of {STUDIES.length} studies
            </span>
          </div>

          <div className="rs-scroll">
            <table className="rs-table">
              <thead>
                <tr>
                  <th>Protocol</th>
                  <th>Sponsor</th>
                  <th>Phase</th>
                  <th>Ran</th>
                  <th>Title</th>
                </tr>
              </thead>
              <tbody>
                {estudios.map((s) => (
                  <tr key={s.nct + s.protocol}>
                    <td>
                      <b className="mono">{s.protocol}</b>
                      <small className="mono">
                        <a href={`https://clinicaltrials.gov/study/${s.nct}`} target="_blank" rel="noopener noreferrer">
                          {s.nct} ↗
                        </a>
                      </small>
                    </td>
                    <td>{s.sponsor}</td>
                    <td><span className="rs-phase">{s.phase}</span></td>
                    <td className="mono rs-ran">{s.start} → {s.end}</td>
                    <td className="rs-title">{s.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Documentos del sitio ───────────────────────────────────────── */}
      {tab === "docs" && (
        <section className="ks-card rs-card">
          <h4 className="rs-h">Site-level documents</h4>
          <p className="rs-sub">
            The regulatory file the site keeps outside any one study. Only the CLIA certificate
            carries an expiry — the rest are on file and do not lapse.
          </p>
          <div className="rs-docs">
            {SITE_DOCS.map((d) => (
              <div className="rs-doc" key={d.label + d.id}>
                <div className="rs-dochd">
                  <b>{d.label}</b>
                  {d.date ? <Pill date={d.date} /> : <span className="rs-onfile">On file</span>}
                </div>
                {d.id ? <span className="mono rs-docid">{d.id}</span> : null}
                {d.date ? <span className="rs-docdate">Expires {fmt(d.date)}</span> : null}
                <p>{d.note}</p>
                {d.url ? (
                  <a href={d.url} target="_blank" rel="noopener noreferrer">Renew ↗</a>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
