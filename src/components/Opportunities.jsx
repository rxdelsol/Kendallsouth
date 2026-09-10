import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PageHead } from "./Shell.jsx";
import { supabase, supabaseReady } from "../lib/supabase.js";
import { AREAS } from "../data/research.js";
import { daysUntil, statusOf, STATUS_META } from "../utils/credStatus";
import "./styles/opps.css";

// Aplicar a estudios: buscar lo que está reclutando en Florida y llevar la
// cuenta de a qué se aplicó.
//
// Las dos mitades tienen que estar juntas. Buscar sin registrar produce una
// lista de buenas intenciones que se olvida el viernes; registrar sin buscar
// deja el pipeline dependiendo de a quién se le ocurra mandar un correo. Lo que
// hace trabajo de verdad es que al aplicar quede una fila con fecha y con
// próximo paso, y que esa fila avise cuando lleva mucho callada.

const ETAPAS = [
  { id: "interested",      label: "Interested",     hint: "Todavía no se mandó nada" },
  { id: "feasibility_sent",label: "Feasibility sent",hint: "Esperando respuesta del sponsor" },
  { id: "cda_signed",      label: "CDA signed",     hint: "Ya se puede ver el protocolo" },
  { id: "site_selected",   label: "Site selected",  hint: "Nos eligieron" },
  { id: "startup",         label: "In start-up",    hint: "Contrato, presupuesto, IRB" },
  { id: "not_selected",    label: "Not selected",   hint: "El sponsor dijo que no" },
  { id: "declined",        label: "We declined",    hint: "Lo dejamos pasar nosotros" },
  { id: "closed",          label: "Closed",         hint: "Terminado o retirado" },
];
const ETAPA = Object.fromEntries(ETAPAS.map((e) => [e.id, e]));
const ABIERTAS = ["interested", "feasibility_sent", "cda_signed", "site_selected", "startup"];

// Una feasibility que lleva más de tres semanas sin respuesta no está "en
// proceso": está esperando que alguien de acá levante el teléfono.
const SILENCIO_DIAS = 21;

const fmt = (d) =>
  !d ? "—" : new Date(String(d).slice(0, 10) + "T00:00:00")
    .toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });

const vacio = () => ({
  nct: "", protocol: "", title: "", sponsor: "", cro: "", indication: "", phase: "",
  stage: "interested", applied_on: "", next_step: "", next_due: "", owner_name: "",
  contact: "", url: "", notes: "",
});

export default function Opportunities() {
  const [tab, setTab] = useState("pipeline");

  // búsqueda
  const [q, setQ] = useState("");
  const [fase, setFase] = useState("");
  const [incluirProximos, setIncluirProximos] = useState(true);
  const [res, setRes] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [errBusca, setErrBusca] = useState(null);

  // pipeline
  const [apps, setApps] = useState([]);
  const [sesion, setSesion] = useState(null);
  const [rol, setRol] = useState(null);
  const [form, setForm] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [fEtapa, setFEtapa] = useState("open");

  // ── sesión ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabaseReady) return;
    supabase.auth.getSession().then(({ data }) => setSesion(data?.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSesion(s));
    return () => sub?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sesion) { setRol(null); return; }
    supabase.from("site_users").select("role,active").eq("id", sesion.user.id).maybeSingle()
      .then(({ data }) => setRol(data?.active ? data.role : null));
  }, [sesion]);

  const puedeEditar = rol === "member" || rol === "admin";

  const cargar = useCallback(async () => {
    if (!supabaseReady || !rol) return;
    const { data, error } = await supabase.from("trial_applications").select("*")
      .order("next_due", { ascending: true, nullsFirst: false });
    if (error) { setAviso({ tipo: "mal", txt: error.message }); return; }
    setApps(data || []);
  }, [rol]);

  useEffect(() => { cargar(); }, [cargar]);

  // ── búsqueda ──────────────────────────────────────────────────────────────
  const buscar = useCallback(async (termino, pagina) => {
    setBuscando(true);
    setErrBusca(null);
    const p = new URLSearchParams();
    if (termino) p.set("q", termino);
    if (fase) p.set("phase", fase);
    p.set("status", incluirProximos ? "RECRUITING,NOT_YET_RECRUITING" : "RECRUITING");
    if (pagina) p.set("page", pagina);
    try {
      const r = await fetch("/api/trial-search?" + p.toString());
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || "search failed");
      setRes((prev) => (pagina && prev
        ? { ...d, studies: [...prev.studies, ...d.studies] }
        : d));
    } catch (e) {
      setErrBusca(String(e.message || e));
    }
    setBuscando(false);
  }, [fase, incluirProximos]);

  // Buscar por un área terapéutica del perfil, en un clic. Son las áreas que el
  // sitio ya declara a los sponsors, así que es donde tiene algo que enseñar.
  const buscarArea = (a) => {
    const t = a.terms.slice(0, 6).join(" OR ");
    setQ(t);
    setTab("search");
    buscar(t, null);
  };

  const yaAplicado = useMemo(() => new Set(apps.map((a) => a.nct).filter(Boolean)), [apps]);

  const desdeBusqueda = (s) => {
    setForm({
      ...vacio(),
      nct: s.nct,
      title: s.title,
      sponsor: s.sponsor,
      indication: (s.conditions || []).slice(0, 2).join(", "),
      phase: (s.phases || []).join(", "),
      url: s.url,
      contact: (s.contacts || []).map((c) => [c.name, c.email, c.phone].filter(Boolean).join(" · ")).join(" | "),
      stage: "interested",
    });
    setTab("pipeline");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── guardar ───────────────────────────────────────────────────────────────
  const guardar = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setAviso({ tipo: "mal", txt: "Give it a title." }); return; }
    const fila = {
      ...form,
      nct: form.nct.trim() || null,
      protocol: form.protocol.trim() || null,
      applied_on: form.applied_on || null,
      next_due: form.next_due || null,
      created_by: sesion?.user?.id || null,
    };
    delete fila.id;
    const { data, error } = form.id
      ? await supabase.from("trial_applications").update(fila).eq("id", form.id).select().single()
      : await supabase.from("trial_applications").insert(fila).select().single();
    if (error) { setAviso({ tipo: "mal", txt: error.message }); return; }
    setApps((p) => (form.id ? p.map((a) => (a.id === data.id ? data : a)) : [data, ...p]));
    setForm(null);
    setAviso({ tipo: "bien", txt: `Saved ${data.title}.` });
  };

  const borrar = async (a) => {
    const { error } = await supabase.from("trial_applications").delete().eq("id", a.id);
    if (error) { setAviso({ tipo: "mal", txt: error.message }); return; }
    setApps((p) => p.filter((x) => x.id !== a.id));
  };

  // ── vistas ────────────────────────────────────────────────────────────────
  const lista = useMemo(() => {
    if (fEtapa === "all") return apps;
    if (fEtapa === "open") return apps.filter((a) => ABIERTAS.includes(a.stage));
    return apps.filter((a) => a.stage === fEtapa);
  }, [apps, fEtapa]);

  const conteo = useMemo(() => {
    const c = { abiertas: 0, esperando: 0, calladas: 0, vencidas: 0 };
    apps.forEach((a) => {
      if (ABIERTAS.includes(a.stage)) c.abiertas++;
      if (a.stage === "feasibility_sent") {
        c.esperando++;
        const d = a.applied_on ? -daysUntil(a.applied_on) : null;
        if (d !== null && d > SILENCIO_DIAS) c.calladas++;
      }
      if (a.next_due && daysUntil(a.next_due) < 0 && ABIERTAS.includes(a.stage)) c.vencidas++;
    });
    return c;
  }, [apps]);

  if (!supabaseReady) {
    return (
      <div className="op">
        <PageHead icono="opps" titulo="Opportunities" sub="Find trials in Florida and track what you applied to" />
        <section className="ks-card fx-empty">
          <h4>Two settings are missing</h4>
          <p>
            The pipeline lives in Supabase, so this page needs <code>VITE_SUPABASE_URL</code> and
            <code> VITE_SUPABASE_ANON_KEY</code> in Vercel, both of type Config. The same two that
            Study Files asks for. The search below works without them.
          </p>
        </section>
        <Buscador {...{ q, setQ, fase, setFase, incluirProximos, setIncluirProximos, buscar, buscando, res, errBusca, yaAplicado, desdeBusqueda: null, AREAS, buscarArea }} />
      </div>
    );
  }

  return (
    <div className="op">
      <PageHead icono="opps" titulo="Opportunities" sub="Find trials recruiting in Florida and track what you applied to" />

      {aviso && <div className={`fx-aviso ${aviso.tipo}`} onClick={() => setAviso(null)}>{aviso.txt}</div>}

      <div className="ins-summary">
        <div className="sum-tile"><span className="sum-num">{conteo.abiertas}</span><span className="sum-lbl">Open</span></div>
        <div className="sum-tile"><span className="sum-num">{conteo.esperando}</span><span className="sum-lbl">Awaiting sponsor</span></div>
        <div className={`sum-tile ${conteo.calladas ? "t-60" : ""}`}><span className="sum-num">{conteo.calladas}</span><span className="sum-lbl">Silent &gt; {SILENCIO_DIAS}d</span></div>
        <div className={`sum-tile ${conteo.vencidas ? "t-expired" : ""}`}><span className="sum-num">{conteo.vencidas}</span><span className="sum-lbl">Next step overdue</span></div>
      </div>

      <div className="rs-tabs">
        <button className={`rs-tab ${tab === "pipeline" ? "on" : ""}`} onClick={() => setTab("pipeline")}>Pipeline</button>
        <button className={`rs-tab ${tab === "search" ? "on" : ""}`} onClick={() => setTab("search")}>Find trials in Florida</button>
      </div>

      {tab === "search" && (
        <Buscador {...{ q, setQ, fase, setFase, incluirProximos, setIncluirProximos, buscar, buscando, res, errBusca, yaAplicado, desdeBusqueda: puedeEditar ? desdeBusqueda : null, AREAS, buscarArea }} />
      )}

      {tab === "pipeline" && (
        <>
          {!rol && (
            <section className="ks-card fx-empty">
              <h4>Sign in to see the pipeline</h4>
              <p>
                The applications live behind the same named accounts as Study Files. Open that
                section, sign in, and come back — the session is shared.
              </p>
            </section>
          )}

          {rol && form && (
            <section className="ks-card op-card">
              <h4 className="rs-h">{form.id ? "Edit application" : "New application"}</h4>
              <form className="fx-form" onSubmit={guardar}>
                <label className="wide"><span>Title</span>
                  <input className="ks-field" value={form.title} required
                    onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
                <label><span>Sponsor</span>
                  <input className="ks-field" value={form.sponsor || ""}
                    onChange={(e) => setForm({ ...form, sponsor: e.target.value })} /></label>
                <label><span>CRO</span>
                  <input className="ks-field" value={form.cro || ""}
                    onChange={(e) => setForm({ ...form, cro: e.target.value })} /></label>
                <label><span>NCT</span>
                  <input className="ks-field" value={form.nct || ""} placeholder="NCT01234567"
                    onChange={(e) => setForm({ ...form, nct: e.target.value })} /></label>
                <label><span>Sponsor protocol</span>
                  <input className="ks-field" value={form.protocol || ""}
                    onChange={(e) => setForm({ ...form, protocol: e.target.value })} /></label>
                <label><span>Indication</span>
                  <input className="ks-field" value={form.indication || ""}
                    onChange={(e) => setForm({ ...form, indication: e.target.value })} /></label>
                <label><span>Phase</span>
                  <input className="ks-field" value={form.phase || ""} placeholder="Phase 3"
                    onChange={(e) => setForm({ ...form, phase: e.target.value })} /></label>
                <label><span>Stage</span>
                  <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
                    {ETAPAS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select></label>
                <label><span>Applied on</span>
                  <input className="ks-field" type="date" value={form.applied_on || ""}
                    onChange={(e) => setForm({ ...form, applied_on: e.target.value })} /></label>
                <label><span>Owner</span>
                  <input className="ks-field" value={form.owner_name || ""} placeholder="Who is chasing it"
                    onChange={(e) => setForm({ ...form, owner_name: e.target.value })} /></label>
                <label className="wide"><span>Next step</span>
                  <input className="ks-field" value={form.next_step || ""} placeholder="Send the feasibility questionnaire"
                    onChange={(e) => setForm({ ...form, next_step: e.target.value })} /></label>
                <label><span>Next step due</span>
                  <input className="ks-field" type="date" value={form.next_due || ""}
                    onChange={(e) => setForm({ ...form, next_due: e.target.value })} /></label>
                <label className="wide"><span>Sponsor contact</span>
                  <input className="ks-field" value={form.contact || ""}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })} /></label>
                <label className="wide"><span>Link</span>
                  <input className="ks-field" value={form.url || ""}
                    onChange={(e) => setForm({ ...form, url: e.target.value })} /></label>
                <label className="wide"><span>Notes</span>
                  <textarea className="ks-field" rows={3} value={form.notes || ""}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
                <div className="fx-submit">
                  <button type="button" className="btn-cancel" onClick={() => setForm(null)}>Cancel</button>
                  <button className="btn-red" type="submit">Save</button>
                </div>
              </form>
            </section>
          )}

          {rol && (
            <section className="ks-card op-card">
              <div className="fx-tools">
                <select value={fEtapa} onChange={(e) => setFEtapa(e.target.value)}>
                  <option value="open">Open only</option>
                  <option value="all">All</option>
                  {ETAPAS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <span className="rs-hint">
                  A feasibility that has been quiet for more than {SILENCIO_DIAS} days is not "in
                  progress" — it is waiting for someone here to pick up the phone.
                </span>
                {puedeEditar && !form && (
                  <button className="btn-red op-new" onClick={() => setForm(vacio())}>Add one</button>
                )}
              </div>

              {lista.length === 0 ? (
                <p className="fx-none">
                  Nothing here yet. Search Florida in the other tab and press <b>Track this</b> on
                  whatever is worth a shot.
                </p>
              ) : (
                <div className="rs-scroll">
                  <table className="rs-table">
                    <thead>
                      <tr><th>Trial</th><th>Sponsor</th><th>Stage</th><th>Applied</th><th>Next step</th><th></th></tr>
                    </thead>
                    <tbody>
                      {lista.map((a) => {
                        const callada = a.stage === "feasibility_sent" && a.applied_on &&
                          -daysUntil(a.applied_on) > SILENCIO_DIAS;
                        const st = a.next_due ? statusOf(a.next_due) : null;
                        return (
                          <tr key={a.id}>
                            <td>
                              <b>{a.title}</b>
                              <small>
                                {[a.indication, a.phase].filter(Boolean).join(" · ")}
                                {a.nct ? <> · <a href={a.url || `https://clinicaltrials.gov/study/${a.nct}`}
                                  target="_blank" rel="noopener noreferrer">{a.nct} ↗</a></> : null}
                              </small>
                              {a.contact ? <small className="op-contact">{a.contact}</small> : null}
                            </td>
                            <td>{a.sponsor || "—"}{a.cro ? <small>{a.cro}</small> : null}</td>
                            <td>
                              <span className={`op-stage s-${a.stage}`}>{ETAPA[a.stage]?.label || a.stage}</span>
                              {callada ? <small className="op-silent">quiet {Math.round(-daysUntil(a.applied_on))}d</small> : null}
                            </td>
                            <td className="rs-when"><small>{fmt(a.applied_on)}</small></td>
                            <td>
                              {a.next_step ? <span className="op-next">{a.next_step}</span> : <span className="rs-todo">nothing set</span>}
                              {a.next_due ? (
                                <small>
                                  {fmt(a.next_due)}{" "}
                                  <span className={`sem-pill sem-mini ${STATUS_META[st].cls}`}>
                                    {st === "expired" ? `${Math.abs(daysUntil(a.next_due))}d over` : `${daysUntil(a.next_due)}d`}
                                  </span>
                                </small>
                              ) : null}
                            </td>
                            <td className="fx-acts">
                              {puedeEditar && <button className="link-btn" onClick={() => setForm({ ...a })}>Edit</button>}
                              {rol === "admin" && <button className="link-btn fx-del" onClick={() => borrar(a)}>Delete</button>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

// ── Buscador ────────────────────────────────────────────────────────────────
function Buscador({ q, setQ, fase, setFase, incluirProximos, setIncluirProximos, buscar, buscando, res, errBusca, yaAplicado, desdeBusqueda, AREAS, buscarArea }) {
  return (
    <>
      <section className="ks-card op-card">
        <h4 className="rs-h">Recruiting in Florida</h4>
        <p className="rs-sub">
          Live from ClinicalTrials.gov, newest changes first. It shows what is recruiting and who to
          write to — the registry is where sponsors publish, not where applications get submitted,
          so "apply" means writing to the central contact or the CRO's site portal.
        </p>

        <form className="fx-tools" onSubmit={(e) => { e.preventDefault(); buscar(q, null); }}>
          <input className="flt-search" placeholder="Condition, drug or sponsor — e.g. asthma, COPD, urticaria"
            value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={fase} onChange={(e) => setFase(e.target.value)}>
            <option value="">Any phase</option>
            <option value="PHASE1">Phase 1</option>
            <option value="PHASE2">Phase 2</option>
            <option value="PHASE3">Phase 3</option>
            <option value="PHASE4">Phase 4</option>
          </select>
          <label className="rs-toggle">
            <input type="checkbox" checked={incluirProximos} onChange={(e) => setIncluirProximos(e.target.checked)} />
            Include not-yet-recruiting
          </label>
          <button className="btn-red" type="submit" disabled={buscando}>{buscando ? "Searching…" : "Search"}</button>
        </form>

        <div className="op-areas">
          <span className="op-areahint">Or start from an area the site already declares:</span>
          {AREAS.map((a) => (
            <button key={a.area} className="rs-chip op-areachip" onClick={() => buscarArea(a)}>{a.area}</button>
          ))}
        </div>
      </section>

      {errBusca && (
        <div className="fx-aviso mal">
          Search failed: {errBusca}. If it says 404, the <code>api/trial-search.js</code> function
          has not been deployed yet.
        </div>
      )}

      {res && (
        <section className="ks-card op-card">
          <p className="op-count">
            {res.total != null ? <><b>{res.total.toLocaleString()}</b> match in Florida</> : "Results"} ·
            showing {res.studies.length}
            {res.degraded ? <span className="op-degraded"> · the phase filter did not apply, so these are all phases</span> : null}
          </p>
          <div className="op-results">
            {res.studies.map((s) => (
              <div className={`op-hit ${s.crowded ? "crowded" : ""}`} key={s.nct}>
                <div className="op-hithd">
                  <a className="mono" href={s.url} target="_blank" rel="noopener noreferrer">{s.nct} ↗</a>
                  {(s.phases || []).map((f) => <span className="rs-phase" key={f}>{f}</span>)}
                  <span className={`op-status st-${(s.status || "").toLowerCase()}`}>
                    {s.status === "RECRUITING" ? "Recruiting" : "Not yet recruiting"}
                  </span>
                  {yaAplicado.has(s.nct) && <span className="op-already">Already in your pipeline</span>}
                </div>
                <p className="op-title">{s.title}</p>
                <span className="op-sponsor">{s.sponsor}{s.collaborators?.length ? ` · with ${s.collaborators.join(", ")}` : ""}</span>
                <div className="op-facts">
                  <span>{(s.conditions || []).join(", ") || "—"}</span>
                  <span>{s.enrollment != null ? `${s.enrollment.toLocaleString()} planned` : "enrolment not posted"}</span>
                  <span>{s.siteCount} sites{s.floridaSites?.length ? ` · ${s.floridaSites.length}+ in FL` : ""}</span>
                  <span>updated {fmt(s.lastUpdate)}</span>
                </div>
                {s.crowded && (
                  <p className="op-warn">
                    {s.siteCount} sites already open. Studies this crowded rarely add more — worth a
                    call before spending an afternoon on the questionnaire.
                  </p>
                )}
                {s.contacts?.length ? (
                  <p className="op-contacts">
                    <b>Contact:</b>{" "}
                    {s.contacts.map((c, i) => (
                      <span key={i}>
                        {c.name}{c.role ? ` (${c.role})` : ""}
                        {c.email ? <> · <a href={`mailto:${c.email}`}>{c.email}</a></> : null}
                        {c.phone ? ` · ${c.phone}` : ""}
                        {i < s.contacts.length - 1 ? " | " : ""}
                      </span>
                    ))}
                  </p>
                ) : (
                  <p className="op-contacts none">
                    No central contact posted. The study page lists the site contacts instead.
                  </p>
                )}
                <div className="op-hitacts">
                  <a className="ks-btn" href={s.url} target="_blank" rel="noopener noreferrer">Open on ClinicalTrials.gov</a>
                  {desdeBusqueda && !yaAplicado.has(s.nct) && (
                    <button className="btn-red" onClick={() => desdeBusqueda(s)}>Track this</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {res.nextPage && (
            <div className="op-more">
              <button className="ks-btn" disabled={buscando} onClick={() => buscar(q, res.nextPage)}>
                {buscando ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </section>
      )}
    </>
  );
}
