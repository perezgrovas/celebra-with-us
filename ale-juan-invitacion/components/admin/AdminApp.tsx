"use client";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  Eye,
  Save,
  Send,
  LogOut,
  Heart,
  SlidersHorizontal,
  Users,
  Armchair,
  Image as ImageIcon,
  LayoutList,
  PenLine,
  CalendarDays,
  Menu,
} from "lucide-react";
import { configSchema, defaultConfig, type WeddingConfig } from "@/lib/config";
import { getBrowserClient, isConfigured } from "@/lib/supabase/client";
import {
  createWedding,
  loadWedding,
  saveWedding,
  unpublishWedding,
  loadAdminData,
} from "@/lib/services/weddings";
import type { Wedding, Asset, Guest, Group, WeddingTable } from "@/lib/types";
import Invitation from "@/components/Invitation";
import AssetFonts from "@/components/AssetFonts";
import ConfigEditor, { Field, type EditorTab } from "./ConfigEditor";
import AssetsPanel from "./AssetsPanel";
import GuestsPanel from "./GuestsPanel";
import TablesPanel from "./TablesPanel";
const tabs = [
  { id: "datos", name: "Detalles del día", icon: CalendarDays },
  { id: "secciones", name: "Secciones", icon: LayoutList },
  { id: "diseno", name: "Colores y tipografías", icon: SlidersHorizontal },
  { id: "contenido", name: "Textos e itinerario", icon: PenLine },
  { id: "archivos", name: "Fotos y archivos", icon: ImageIcon },
  { id: "invitados", name: "Invitados y RSVP", icon: Users },
  { id: "mesas", name: "Mesas", icon: Armchair },
] as const;
export default function AdminApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [config, setConfig] = useState<WeddingConfig>(defaultConfig);
  const [data, setData] = useState<{
    assets: Asset[];
    guests: Guest[];
    groups: Group[];
    tables: WeddingTable[];
  }>({ assets: [], guests: [], groups: [], tables: [] });
  const [tab, setTab] = useState<EditorTab>("datos");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState(false);
  const [nav, setNav] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadError, setLoadError] = useState(false);
  const dirty = Boolean(
    wedding && JSON.stringify(config) !== JSON.stringify(wedding.config),
  );
  const refresh = useCallback(async () => {
    if (wedding) setData(await loadAdminData(wedding.id));
  }, [wedding]);
  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    const db = getBrowserClient();
    db.auth.getSession().then(({ data, error }) => {
      if (error) setNotice("No se pudo recuperar la sesión.");
      setUser(data.session?.user || null);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = db.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!user) {
      setWedding(null);
      setData({ assets: [], guests: [], groups: [], tables: [] });
      return;
    }
    let active = true;
    setLoading(true);
    setLoadError(false);
    loadWedding()
      .then(async (w) => {
        const d = w ? await loadAdminData(w.id) : null;
        if (active) {
          setWedding(w);
          if (w) setConfig(w.config);
          if (d) setData(d);
        }
      })
      .catch((e) => {
        if (active) {
          setLoadError(true);
          setNotice(
            e instanceof Error ? e.message : "No se pudo cargar el proyecto.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setLoginError("");
    try {
      const { error } = await getBrowserClient().auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setPassword("");
    } catch {
      setLoginError(
        "No pudimos iniciar sesión. Revisa tu correo y contraseña.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function create() {
    setBusy(true);
    try {
      const w = await createWedding();
      setWedding(w);
      setConfig(w.config);
      setNotice("Tu proyecto está listo. Empieza por los detalles del día.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "No se pudo crear.");
    } finally {
      setBusy(false);
    }
  }
  async function save(publish = false) {
    if (!wedding) return;
    setBusy(true);
    setNotice("");
    try {
      const result = configSchema.safeParse(config);
      if (!result.success)
        throw new Error(
          result.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join(" · "),
        );
      const w = await saveWedding(wedding, result.data, publish);
      setWedding(w);
      setConfig(w.config);
      setNotice(
        publish
          ? "Invitación publicada. Tus invitados ya pueden verla."
          : "Borrador guardado. Publica cuando esté listo.",
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }
  async function unpublish() {
    if (!wedding) return;
    setBusy(true);
    try {
      setWedding(await unpublishWedding(wedding));
      setNotice("Invitación retirada. Ya no es accesible públicamente.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "No se pudo retirar.");
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    if (
      dirty &&
      !window.confirm(
        "Tienes cambios sin guardar. ¿Quieres salir y descartarlos?",
      )
    )
      return;
    const { error } = await getBrowserClient().auth.signOut();
    if (error) setNotice("No se pudo cerrar sesión. Inténtalo de nuevo.");
  }
  if (!isConfigured)
    return (
      <main className="login-page">
        <div className="login-card">
          <Heart />
          <h1>Conecta tu invitación</h1>
          <p>
            Configura Supabase y las variables de entorno siguiendo README.md.
            No se guardarán datos hasta completar este paso.
          </p>
          <a href="/">Volver al inicio</a>
        </div>
      </main>
    );
  if (loading)
    return (
      <main className="empty-page" role="status">
        Cargando tu proyecto…
      </main>
    );
  if (!user)
    return (
      <main className="login-page">
        <div className="login-story">
          <p className="kicker">SU DÍA, A SU MANERA</p>
          <h1>
            Una invitación
            <br />
            tan única como
            <br />
            <em>su historia.</em>
          </h1>
          <p>
            Diseña, comparte y organiza.
            <br />
            Todo en un mismo lugar.
          </p>
        </div>
        <form className="login-card" onSubmit={login}>
          <Heart size={28} />
          <h2>Bienvenida de vuelta</h2>
          <p>Entra para preparar cada detalle de tu invitación.</p>
          <Field label="Correo electrónico">
            <input
              required
              autoComplete="username"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Contraseña">
            <input
              required
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <button disabled={busy}>
            {busy ? "Entrando…" : "Entrar a mi invitación"}
          </button>
          <p role="alert" className="error">
            {loginError}
          </p>
          <small>Acceso privado para los organizadores.</small>
        </form>
      </main>
    );
  if (!wedding)
    return (
      <main className="empty-page">
        <h1>
          {loadError
            ? "No pudimos cargar tu proyecto"
            : "Vamos a crear su invitación"}
        </h1>
        <p>
          {notice || "El proyecto será privado hasta que decidas publicarlo."}
        </p>
        {!loadError && (
          <button disabled={busy} onClick={create}>
            Crear proyecto
          </button>
        )}
        {loadError && (
          <button onClick={() => window.location.reload()}>
            Volver a intentar
          </button>
        )}
        <button className="secondary" onClick={() => void logout()}>
          Cerrar sesión
        </button>
      </main>
    );
  const previewConfig = configSchema.safeParse(config).success
    ? config
    : wedding.config;
  const confirmed = data.guests.filter((g) => g.status === "attending").length;
  const pending = data.guests.filter((g) => g.status === "pending").length;
  return (
    <div className="admin-shell">
      <AssetFonts assets={data.assets} />
      <header className="admin-header">
        <div className="admin-brand">
          <button
            className="icon-button mobile-menu"
            aria-label="Abrir navegación"
            onClick={() => setNav(!nav)}
          >
            <Menu size={20} />
          </button>
          <Heart size={21} />
          <div>
            <b>
              {config.couple.bride} & {config.couple.groom}
            </b>
            <small>Su invitación, a su manera</small>
          </div>
        </div>
        <div className="header-actions">
          <span className={`status-dot ${wedding.published ? "live" : ""}`}>
            {wedding.published ? "Publicada" : "Borrador"}
          </span>
          <button
            aria-label="Vista previa"
            className="secondary"
            onClick={() => setPreview(!preview)}
          >
            <Eye size={16} />
            <span>Vista previa</span>
          </button>
          <button
            aria-label="Guardar"
            className="secondary"
            disabled={busy}
            onClick={() => void save()}
          >
            <Save size={16} />
            <span>Guardar</span>
          </button>
          <button
            aria-label="Publicar"
            disabled={busy}
            onClick={() => void save(true)}
          >
            <Send size={16} />
            <span>{busy ? "Guardando…" : "Publicar"}</span>
          </button>
        </div>
      </header>
      <div className="admin-layout">
        <aside className={nav ? "open" : ""}>
          <p className="nav-label">DISEÑA TU INVITACIÓN</p>
          <nav aria-label="Editor de invitación">
            {tabs.map((t, i) => (
              <div key={t.id}>
                {i === 5 && <p className="nav-label">ORGANIZA EL GRAN DÍA</p>}
                <button
                  aria-current={tab === t.id ? "page" : undefined}
                  className={tab === t.id ? "active" : ""}
                  onClick={() => {
                    setTab(t.id);
                    setNav(false);
                  }}
                >
                  <t.icon size={18} />
                  {t.name}
                </button>
              </div>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <a href="/" target="_blank" rel="noopener noreferrer">
              Ver versión publicada ↗
            </a>
            {wedding.published && (
              <button
                className="text-danger"
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm(
                      "¿Retirar la invitación pública? Tus datos se conservarán.",
                    )
                  )
                    void unpublish();
                }}
              >
                Retirar publicación
              </button>
            )}
            <button onClick={() => void logout()}>
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        </aside>
        <section className="control-panel">
          <div className="dashboard-top">
            <div>
              <p className="kicker">EL COMIENZO DE ALGO BONITO</p>
              <h1>Hagámosla suya.</h1>
              <p>
                Cada detalle cuenta. Empieza por lo esencial y dale tu toque.
              </p>
            </div>
            <span className="save-state">
              {dirty ? "Cambios sin guardar" : "Todo guardado"}
            </span>
          </div>
          <div className="stats">
            <article>
              <span>INVITADOS</span>
              <strong>{data.guests.length}</strong>
            </article>
            <article>
              <span>CONFIRMADOS</span>
              <strong>{confirmed}</strong>
            </article>
            <article>
              <span>PENDIENTES</span>
              <strong>{pending}</strong>
            </article>
          </div>
          <div className="notice" role="status">
            {notice ||
              "Guarda tu borrador cuando quieras. Publicar actualiza la invitación que ven tus invitados."}
          </div>
          <div className="editor-heading">
            <span className="step-pill">
              {String(tabs.findIndex((t) => t.id === tab) + 1).padStart(2, "0")}
            </span>
            <h2>{tabs.find((t) => t.id === tab)?.name}</h2>
            {(tab === "invitados" || tab === "mesas") && (
              <button
                className="secondary"
                disabled={busy}
                onClick={() =>
                  void refresh().catch((e) => setNotice(String(e)))
                }
              >
                Actualizar respuestas
              </button>
            )}
          </div>
          <fieldset className="editor-fields" disabled={busy}>
            {tab === "archivos" ? (
              <AssetsPanel
                wid={wedding.id}
                assets={data.assets}
                config={config}
                onChange={setConfig}
                refresh={refresh}
                report={setNotice}
              />
            ) : tab === "invitados" ? (
              <GuestsPanel
                wid={wedding.id}
                groups={data.groups}
                guests={data.guests}
                refresh={refresh}
                report={setNotice}
              />
            ) : tab === "mesas" ? (
              <TablesPanel
                wid={wedding.id}
                tables={data.tables}
                guests={data.guests}
                refresh={refresh}
                report={setNotice}
              />
            ) : (
              <ConfigEditor
                tab={tab}
                config={config}
                onChange={setConfig}
                assets={data.assets}
              />
            )}
          </fieldset>
        </section>
        <section className={`preview-panel ${preview ? "preview-open" : ""}`}>
          <div className="preview-label">
            <span>VISTA PREVIA EN VIVO</span>
            <button
              className="icon-button"
              aria-label="Cerrar vista previa"
              onClick={() => setPreview(false)}
            >
              ×
            </button>
          </div>
          <div className="phone">
            <Invitation config={previewConfig} assets={data.assets} preview />
          </div>
          <p className="preview-tip">
            Así se verá en su celular.
            <br />
            Desliza para ver todas las secciones.
          </p>
        </section>
      </div>
    </div>
  );
}
