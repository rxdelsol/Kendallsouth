import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHead } from "./Shell.jsx";
import { supabase, supabaseReady, BUCKET, CATEGORIES, safeName, slug, humanSize } from "../lib/supabase.js";
import { ACTIVE_STUDIES } from "../data/research.js";
import "./styles/files.css";

// Binder regulatorio por estudio: subir, buscar, descargar.
//
// Tres decisiones que vale la pena dejar escritas:
//
// 1. Los archivos NO son públicos. El bucket es privado y cada descarga pide
//    una URL firmada que caduca en un minuto. Es más trabajo que un enlace fijo
//    y es justamente el punto: un enlace fijo a un protocolo se reenvía por
//    correo y ya no hay forma de saber quién lo tiene.
//
// 2. Cada acción queda en doc_events con el correo de quien la hizo. Cuando un
//    monitor pregunta quién sacó la versión vieja del protocolo, la respuesta
//    está acá y no en la memoria de nadie.
//
// 3. Nada se borra por accidente: borrar es solo de admin, y aun así primero
//    se ofrece marcar el documento como superseded. En un binder, la versión
//    vieja no es basura — es la prueba de qué se firmó cuándo.

const fmt = (d) =>
  !d ? "—" : new Date(String(d).slice(0, 10) + "T00:00:00").toLocaleDateString("en-US",
    { year: "numeric", month: "short", day: "2-digit" });

const fmtTime = (t) => (t ? new Date(t).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "—");

export default function StudyFiles() {
  const [sesion, setSesion] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  const [docs, setDocs] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [protocolo, setProtocolo] = useState("all");
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [verViejos, setVerViejos] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [verLog, setVerLog] = useState(false);

  const fileRef = useRef(null);
  const [form, setForm] = useState({ protocol: "", category: "Protocol & amendments", title: "", version: "", doc_date: "" });

  const protocolos = useMemo(() => ACTIVE_STUDIES.map((s) => s.protocol), []);

  // ── sesión ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabaseReady) { setCargando(false); return; }
    let vivo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!vivo) return;
      setSesion(data?.session || null);
      setCargando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSesion(s));
    return () => { vivo = false; sub?.subscription?.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!sesion) { setPerfil(null); return; }
    supabase.from("site_users").select("*").eq("id", sesion.user.id).maybeSingle()
      .then(({ data }) => setPerfil(data || null));
  }, [sesion]);

  const rol = perfil?.active ? perfil.role : null;
  const puedeSubir = rol === "member" || rol === "admin";
  const esAdmin = rol === "admin";

  // ── datos ─────────────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    if (!sesion || !rol) return;
    const { data, error } = await supabase.from("study_docs").select("*").order("uploaded_at", { ascending: false });
    if (error) { setAviso({ tipo: "mal", txt: error.message }); return; }
    setDocs(data || []);
  }, [sesion, rol]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (!verLog || !esAdmin) return;
    supabase.from("doc_events").select("*").order("at", { ascending: false }).limit(200)
      .then(({ data }) => setEventos(data || []));
  }, [verLog, esAdmin]);

  const registrar = async (accion, doc) => {
    if (!sesion) return;
    await supabase.from("doc_events").insert({
      doc_id: doc?.id || null,
      protocol: doc?.protocol || null,
      filename: doc?.filename || null,
      action: accion,
      actor: sesion.user.id,
      actor_email: sesion.user.email,
    });
  };

  // ── subir ─────────────────────────────────────────────────────────────────
  const subir = async (e) => {
    e.preventDefault();
    const archivo = fileRef.current?.files?.[0];
    if (!archivo) { setAviso({ tipo: "mal", txt: "Pick a file first." }); return; }
    if (!form.protocol) { setAviso({ tipo: "mal", txt: "Pick which study it belongs to." }); return; }
    if (archivo.size > 50 * 1024 * 1024) { setAviso({ tipo: "mal", txt: "That file is over the 50 MB limit." }); return; }

    setSubiendo(true);
    setAviso(null);
    const limpio = safeName(archivo.name);
    const ruta = `${slug(form.protocol)}/${Date.now()}-${limpio}`;

    const { error: eUp } = await supabase.storage.from(BUCKET).upload(ruta, archivo, {
      cacheControl: "0", upsert: false, contentType: archivo.type || "application/octet-stream",
    });
    if (eUp) { setSubiendo(false); setAviso({ tipo: "mal", txt: "Upload failed: " + eUp.message }); return; }

    const fila = {
      protocol: form.protocol,
      category: form.category,
      title: form.title.trim() || archivo.name,
      version: form.version.trim() || null,
      doc_date: form.doc_date || null,
      filename: archivo.name,
      storage_path: ruta,
      bytes: archivo.size,
      mime: archivo.type || null,
      uploaded_by: sesion.user.id,
    };
    const { data, error } = await supabase.from("study_docs").insert(fila).select().single();
    if (error) {
      // La fila no entró: el archivo queda huérfano en el bucket, así que se
      // retira. Un bucket con archivos que ninguna fila menciona es un bucket
      // que nadie puede volver a encontrar.
      await supabase.storage.from(BUCKET).remove([ruta]);
      setSubiendo(false);
      setAviso({ tipo: "mal", txt: "Saved the file but not the record, so I removed the file: " + error.message });
      return;
    }
    await registrar("upload", data);
    setDocs((prev) => [data, ...prev]);
    setForm({ protocol: form.protocol, category: form.category, title: "", version: "", doc_date: "" });
    if (fileRef.current) fileRef.current.value = "";
    setSubiendo(false);
    setAviso({ tipo: "bien", txt: `Uploaded ${data.title} to ${data.protocol}.` });
  };

  // ── descargar ─────────────────────────────────────────────────────────────
  const descargar = async (doc) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.storage_path, 60, {
      download: doc.filename,
    });
    if (error) { setAviso({ tipo: "mal", txt: "Could not open it: " + error.message }); return; }
    await registrar("download", doc);
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const marcarViejo = async (doc) => {
    const { error } = await supabase.from("study_docs").update({ superseded: !doc.superseded }).eq("id", doc.id);
    if (error) { setAviso({ tipo: "mal", txt: error.message }); return; }
    if (!doc.superseded) await registrar("supersede", doc);
    setDocs((p) => p.map((d) => (d.id === doc.id ? { ...d, superseded: !d.superseded } : d)));
  };

  const borrar = async (doc) => {
    await supabase.storage.from(BUCKET).remove([doc.storage_path]);
    const { error } = await supabase.from("study_docs").delete().eq("id", doc.id);
    if (error) { setAviso({ tipo: "mal", txt: error.message }); return; }
    await registrar("delete", doc);
    setDocs((p) => p.filter((d) => d.id !== doc.id));
    setAviso({ tipo: "bien", txt: `Deleted ${doc.title}. The event stays in the audit log.` });
  };

  // ── filtros ───────────────────────────────────────────────────────────────
  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return docs.filter((d) => {
      if (!verViejos && d.superseded) return false;
      if (protocolo !== "all" && d.protocol !== protocolo) return false;
      if (cat !== "all" && d.category !== cat) return false;
      if (!t) return true;
      return (d.title + " " + d.filename + " " + (d.version || "") + " " + d.protocol).toLowerCase().includes(t);
    });
  }, [docs, q, protocolo, cat, verViejos]);

  const porProtocolo = useMemo(() => {
    const m = {};
    docs.forEach((d) => { if (!d.superseded) m[d.protocol] = (m[d.protocol] || 0) + 1; });
    return m;
  }, [docs]);

  const viejos = docs.filter((d) => d.superseded).length;

  // ── pantallas de estado ───────────────────────────────────────────────────
  if (!supabaseReady) {
    return (
      <div className="fx">
        <PageHead icono="files" titulo="Study Files" sub="Regulatory binder by study — upload, search, download" />
        <section className="ks-card fx-empty">
          <h4>Two settings are missing</h4>
          <p>
            This section talks to Supabase straight from the browser, so it needs two variables in
            Vercel → Settings → Environment Variables, both of type <b>Config</b> (they are not secrets):
          </p>
          {/* En JSX las líneas de texto se unen con un espacio, así que el
              salto va dentro de una plantilla o el bloque sale en una sola
              línea larguísima que se desborda de la caja. */}
          <pre>{`VITE_SUPABASE_URL       https://jtyklteafygjxmirsode.supabase.co
VITE_SUPABASE_ANON_KEY  <the anon / public key — Supabase → Settings → API>`}</pre>
          <p>
            The anon key is meant to be public — what decides who sees what are the RLS policies in
            <code> supabase-study-files.sql</code>. The service key, the one that bypasses those
            policies, stays out of the browser. Add both, redeploy, and this page comes to life.
          </p>
        </section>
      </div>
    );
  }

  if (cargando) return <div className="fx"><PageHead icono="files" titulo="Study Files" sub="Loading…" /></div>;

  if (!sesion) return <Login onAviso={setAviso} aviso={aviso} />;

  if (!rol) {
    return (
      <div className="fx">
        <PageHead icono="files" titulo="Study Files" sub="Regulatory binder by study" />
        <section className="ks-card fx-empty">
          <h4>Signed in, but not on the list yet</h4>
          <p>
            <b>{sesion.user.email}</b> has an account but no role, so there is nothing to show. An
            admin adds the role in Supabase — the last block of <code>supabase-study-files.sql</code>
            has the exact line.
          </p>
          <button className="ks-btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </section>
      </div>
    );
  }

  return (
    <div className="fx">
      <PageHead icono="files" titulo="Study Files" sub="Regulatory binder by study — upload, search, download">
        <span className="fx-who">
          {sesion.user.email} · <b>{rol}</b>
          <button className="link-btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </span>
      </PageHead>

      {aviso && (
        <div className={`fx-aviso ${aviso.tipo}`} onClick={() => setAviso(null)}>
          {aviso.txt}
        </div>
      )}

      <div className="fx-warn">
        Regulatory binder only — protocol and amendments, IB, IRB letters, delegation log, training,
        CDAs, equipment logs. No patient source documents: that is PHI and it needs a signed BAA with
        Supabase and Vercel before the first file goes up.
      </div>

      <div className="fx-tiles">
        {ACTIVE_STUDIES.map((s) => (
          <button
            key={s.protocol}
            className={`fx-tile ${protocolo === s.protocol ? "on" : ""}`}
            onClick={() => setProtocolo(protocolo === s.protocol ? "all" : s.protocol)}
          >
            <span className="n">{porProtocolo[s.protocol] || 0}</span>
            <span className="p mono">{s.protocol}</span>
            <span className="s">{s.sponsor || "sponsor not on file"}</span>
          </button>
        ))}
      </div>

      {puedeSubir && (
        <section className="ks-card fx-card">
          <h4 className="fx-h">Add a document</h4>
          <form className="fx-form" onSubmit={subir}>
            <label>
              <span>Study</span>
              <select value={form.protocol} onChange={(e) => setForm({ ...form, protocol: e.target.value })} required>
                <option value="">Pick one…</option>
                {protocolos.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label>
              <span>Category</span>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="wide">
              <span>Title</span>
              <input className="ks-field" value={form.title} placeholder="Protocol amendment 4 — clean copy"
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label>
              <span>Version</span>
              <input className="ks-field" value={form.version} placeholder="v4.0"
                onChange={(e) => setForm({ ...form, version: e.target.value })} />
            </label>
            <label>
              <span>Document date</span>
              <input className="ks-field" type="date" value={form.doc_date}
                onChange={(e) => setForm({ ...form, doc_date: e.target.value })} />
            </label>
            <label className="wide">
              <span>File · 50 MB max</span>
              <input className="ks-field" type="file" ref={fileRef} required />
            </label>
            <div className="fx-submit">
              <button className="btn-red" type="submit" disabled={subiendo}>
                {subiendo ? "Uploading…" : "Upload"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="ks-card fx-card">
        <div className="fx-tools">
          <input className="flt-search" placeholder="Search by title, file name or version…"
            value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={protocolo} onChange={(e) => setProtocolo(e.target.value)}>
            <option value="all">All studies</option>
            {protocolos.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {viejos > 0 && (
            <label className="rs-toggle">
              <input type="checkbox" checked={verViejos} onChange={(e) => setVerViejos(e.target.checked)} />
              Show {viejos} superseded
            </label>
          )}
        </div>

        {lista.length === 0 ? (
          <p className="fx-none">
            {docs.length === 0
              ? "Nothing uploaded yet. The first thing worth putting here is the current protocol of each study — it is what the Active studies tab is still missing."
              : "Nothing matches those filters."}
          </p>
        ) : (
          <div className="rs-scroll">
            <table className="rs-table fx-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Study</th>
                  <th>Category</th>
                  <th>Version · date</th>
                  <th>Uploaded</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((d) => (
                  <tr key={d.id} className={d.superseded ? "rs-off" : ""}>
                    <td>
                      <b>{d.title}</b>
                      <small className="mono">{d.filename} · {humanSize(d.bytes)}</small>
                      {d.superseded ? <small className="rs-tag">Superseded</small> : null}
                    </td>
                    <td className="mono">{d.protocol}</td>
                    <td className="fx-cat">{d.category}</td>
                    <td className="rs-when">
                      {d.version ? <b>{d.version}</b> : <span className="rs-todo">no version</span>}
                      <small>{fmt(d.doc_date)}</small>
                    </td>
                    <td className="rs-when"><small>{fmtTime(d.uploaded_at)}</small></td>
                    <td className="fx-acts">
                      <button className="ks-btn" onClick={() => descargar(d)}>Download</button>
                      {puedeSubir && (
                        <button className="link-btn" onClick={() => marcarViejo(d)}>
                          {d.superseded ? "Make current" : "Mark superseded"}
                        </button>
                      )}
                      {esAdmin && <button className="link-btn fx-del" onClick={() => borrar(d)}>Delete</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {esAdmin && (
        <section className="ks-card fx-card">
          <div className="fx-loghd">
            <h4 className="fx-h">Audit log</h4>
            <button className="ks-btn" onClick={() => setVerLog((v) => !v)}>
              {verLog ? "Hide" : "Show who did what"}
            </button>
          </div>
          {verLog && (
            <div className="rs-scroll">
              <table className="rs-table">
                <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Study</th><th>File</th></tr></thead>
                <tbody>
                  {eventos.map((e) => (
                    <tr key={e.id}>
                      <td className="rs-when"><small>{fmtTime(e.at)}</small></td>
                      <td>{e.actor_email || "—"}</td>
                      <td><span className={`fx-act a-${e.action}`}>{e.action}</span></td>
                      <td className="mono">{e.protocol || "—"}</td>
                      <td className="fx-file">{e.filename || "—"}</td>
                    </tr>
                  ))}
                  {eventos.length === 0 && <tr><td colSpan={5} className="fx-none">Nothing logged yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// ── Login ───────────────────────────────────────────────────────────────────
// Sesión con nombre, aparte de la contraseña compartida del sitio. Esa
// contraseña dice que estás dentro de la clínica; ésta dice quién eres, que es
// lo que hace que el log de descargas signifique algo.
function Login({ aviso, onAviso }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [yendo, setYendo] = useState(false);

  const entrar = async (e) => {
    e.preventDefault();
    setYendo(true);
    onAviso(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
    setYendo(false);
    if (error) onAviso({ tipo: "mal", txt: error.message });
    setPass("");
  };

  return (
    <div className="fx">
      <PageHead icono="files" titulo="Study Files" sub="Regulatory binder by study — upload, search, download" />
      <section className="ks-card fx-login">
        <h4>Sign in</h4>
        <p>
          Your own account, separate from the shared site password. Every upload and every download
          is logged under this name — that is the point of signing in twice.
        </p>
        {aviso && <div className={`fx-aviso ${aviso.tipo}`}>{aviso.txt}</div>}
        <form onSubmit={entrar}>
          <label><span>Email</span>
            <input className="ks-field" type="email" autoComplete="username" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label><span>Password</span>
            <input className="ks-field" type="password" autoComplete="current-password" value={pass}
              onChange={(e) => setPass(e.target.value)} required />
          </label>
          <button className="btn-red" type="submit" disabled={yendo}>{yendo ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="fx-fine">
          Accounts are created in Supabase → Authentication → Users, and the role is set with the
          last block of <code>supabase-study-files.sql</code>. Passwords live in Supabase; this app
          never sees them.
        </p>
      </section>
    </div>
  );
}
