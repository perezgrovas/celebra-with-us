"use client";
import { sectionLabels, type WeddingConfig } from "@/lib/config";
import type { Asset } from "@/lib/types";
export type EditorTab =
  | "datos"
  | "secciones"
  | "diseno"
  | "contenido"
  | "archivos"
  | "invitados"
  | "mesas";
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
const fontOptions = [
  "Georgia",
  "Arial",
  "Palatino",
  "Times New Roman",
  "Trebuchet MS",
];
const palettes = [
  {
    name: "Jardín",
    values: ["#F7F1E8", "#2C2A26", "#7E8666", "#DED7CA", "#2C2A26"],
  },
  {
    name: "Salvia",
    values: ["#F3F4EF", "#28312C", "#89967B", "#DDE2D7", "#465342"],
  },
  {
    name: "Champagne",
    values: ["#F8F2E7", "#342E29", "#B49A78", "#E8DCCB", "#6C5640"],
  },
  {
    name: "Vino",
    values: ["#F7F1EF", "#2E2021", "#7D3D46", "#E5D7D6", "#5B2930"],
  },
];
export default function ConfigEditor({
  tab,
  config,
  onChange,
  assets,
}: {
  tab: EditorTab;
  config: WeddingConfig;
  onChange: (c: WeddingConfig) => void;
  assets: Asset[];
}) {
  const patch = (p: Partial<WeddingConfig>) => onChange({ ...config, ...p });
  const move = (i: number, d: number) => {
    const a = [...config.sections];
    [a[i], a[i + d]] = [a[i + d], a[i]];
    patch({ sections: a });
  };
  if (tab === "datos")
    return (
      <>
        <p className="hint">
          Empieza por los detalles del día. Se actualizan en toda la invitación.
        </p>
        <div className="form-grid">
          {(
            [
              "bride",
              "groom",
              "venue",
              "city",
              "date",
              "time",
              "timezone",
            ] as const
          ).map((k) => (
            <Field
              key={k}
              label={
                {
                  bride: "Nombre de la novia",
                  groom: "Nombre del novio",
                  venue: "Lugar",
                  city: "Ciudad",
                  date: "Fecha",
                  time: "Hora de ceremonia",
                  timezone: "Zona horaria",
                }[k]
              }
            >
              <input
                type={k === "date" ? "date" : k === "time" ? "time" : "text"}
                value={config.couple[k]}
                onChange={(e) =>
                  patch({ couple: { ...config.couple, [k]: e.target.value } })
                }
              />
            </Field>
          ))}
          <Field label="Fecha límite para confirmar">
            <input
              type="date"
              value={config.rsvp.deadline}
              onChange={(e) =>
                patch({ rsvp: { ...config.rsvp, deadline: e.target.value } })
              }
            />
          </Field>
        </div>
        <label className="check-line">
          <input
            type="checkbox"
            checked={config.rsvp.allowChanges}
            onChange={(e) =>
              patch({
                rsvp: { ...config.rsvp, allowChanges: e.target.checked },
              })
            }
          />
          Permitir corregir respuestas antes de la fecha límite
        </label>
        <label className="check-line">
          <input
            type="checkbox"
            checked={config.rsvp.showTables}
            onChange={(e) =>
              patch({ rsvp: { ...config.rsvp, showTables: e.target.checked } })
            }
          />
          Mostrar la mesa asignada a cada invitado
        </label>
      </>
    );
  if (tab === "secciones")
    return (
      <>
        <p className="hint">
          Elige lo que quieres compartir. Usa las flechas para cambiar el orden.
        </p>
        <div className="section-list">
          {config.sections.map((s, i) => (
            <div className="section-row" key={s.key}>
              <label className="check-line">
                <input
                  type="checkbox"
                  checked={s.enabled}
                  onChange={(e) =>
                    patch({
                      sections: config.sections.map((x) =>
                        x.key === s.key
                          ? { ...x, enabled: e.target.checked }
                          : x,
                      ),
                    })
                  }
                />
                <div>
                  <strong>{sectionLabels[s.key]}</strong>
                  <small>{s.enabled ? "Visible" : "Oculta"}</small>
                </div>
              </label>
              <div className="row-actions">
                <button
                  className="icon-button"
                  aria-label={`Subir ${sectionLabels[s.key]}`}
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  ↑
                </button>
                <button
                  className="icon-button"
                  aria-label={`Bajar ${sectionLabels[s.key]}`}
                  disabled={i === config.sections.length - 1}
                  onClick={() => move(i, 1)}
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  if (tab === "diseno")
    return (
      <>
        <h2>Paleta de colores</h2>
        <div className="palette-grid">
          {palettes.map((p) => (
            <button
              key={p.name}
              className="choice-card"
              onClick={() =>
                patch({
                  colors: {
                    bg: p.values[0],
                    text: p.values[1],
                    accent: p.values[2],
                    soft: p.values[3],
                    button: p.values[4],
                  },
                })
              }
            >
              <span>{p.name}</span>
              <div className="swatches">
                {p.values.map((v, i) => (
                  <i key={i} style={{ background: v }} />
                ))}
              </div>
            </button>
          ))}
        </div>
        <div className="form-grid">
          {Object.entries(config.colors).map(([k, v]) => (
            <Field
              key={k}
              label={
                {
                  bg: "Fondo",
                  text: "Texto",
                  accent: "Acento",
                  soft: "Bordes",
                  button: "Botones",
                }[k] || k
              }
            >
              <input
                aria-label={`Color ${k}`}
                type="color"
                value={v}
                onChange={(e) =>
                  patch({ colors: { ...config.colors, [k]: e.target.value } })
                }
              />
            </Field>
          ))}
        </div>
        <h2>Tipografías</h2>
        <p className="hint">
          Puedes subir tus fuentes en Archivos y usarlas aquí.
        </p>
        <div className="form-grid">
          {(["title", "subtitle", "body", "button"] as const).map((k) => (
            <Field
              key={k}
              label={
                {
                  title: "Títulos",
                  subtitle: "Subtítulos",
                  body: "Contenido",
                  button: "Botones",
                }[k]
              }
            >
              <select
                value={config.fonts[k]}
                onChange={(e) =>
                  patch({ fonts: { ...config.fonts, [k]: e.target.value } })
                }
              >
                {fontOptions.map((f) => (
                  <option key={f}>{f}</option>
                ))}
                {assets
                  .filter((a) => a.kind === "font")
                  .map((a) => (
                    <option key={a.id} value={a.family!}>
                      {a.name}
                    </option>
                  ))}
              </select>
              <span
                className="font-example"
                style={{ fontFamily: config.fonts[k] }}
              >
                Ale & Juan · Nos casamos
              </span>
            </Field>
          ))}
        </div>
        <h2>Fondo general</h2>
        <div className="form-grid">
          <Field label="Textura">
            <select
              value={config.background}
              onChange={(e) =>
                patch({
                  background: e.target.value as WeddingConfig["background"],
                })
              }
            >
              {[
                ["ivory", "Marfil"],
                ["paper", "Papel"],
                ["linen", "Lino"],
                ["sage", "Salvia"],
                ["blush", "Rosa"],
              ].map(([v, l]) => (
                <option value={v} key={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Imagen de fondo">
            <select
              value={config.backgroundAssetId || ""}
              onChange={(e) =>
                patch({ backgroundAssetId: e.target.value || null })
              }
            >
              <option value="">Sin imagen</option>
              {assets
                .filter((a) => a.kind === "background")
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Cómo mostrar el fondo">
            <select
              value={config.backgroundMode}
              onChange={(e) =>
                patch({ backgroundMode: e.target.value as "cover" | "repeat" })
              }
            >
              <option value="repeat">Mosaico continuo</option>
              <option value="cover">Cubrir página completa</option>
            </select>
          </Field>
          <Field label="Foto de portada">
            <select
              value={config.heroAssetId || ""}
              onChange={(e) => patch({ heroAssetId: e.target.value || null })}
            >
              <option value="">Sin foto</option>
              {assets
                .filter((a) => a.kind === "photo")
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </Field>
        </div>
      </>
    );
  if (tab === "contenido")
    return (
      <>
        <p className="hint">
          Cuenta su historia con tus palabras. Los enlaces se muestran solo
          cuando los agregas.
        </p>
        {(
          [
            "storyTitle",
            "story",
            "dresscode",
            "lodging",
            "gifts",
            "giftsUrl",
            "mapUrl",
            "final",
          ] as const
        ).map((k) => (
          <Field
            key={k}
            label={
              {
                storyTitle: "Título de nuestra historia",
                story: "Nuestra historia",
                dresscode: "Vestimenta",
                lodging: "Hospedaje",
                gifts: "Texto de regalos",
                giftsUrl: "Enlace de regalos (https://)",
                mapUrl: "Enlace de mapa (https://)",
                final: "Mensaje de despedida",
              }[k]
            }
          >
            {k.endsWith("Url") || k === "storyTitle" ? (
              <input
                value={config.content[k]}
                onChange={(e) =>
                  patch({ content: { ...config.content, [k]: e.target.value } })
                }
              />
            ) : (
              <textarea
                rows={3}
                value={config.content[k]}
                onChange={(e) =>
                  patch({ content: { ...config.content, [k]: e.target.value } })
                }
              />
            )}
          </Field>
        ))}
        <h2>Itinerario</h2>
        {config.schedule.map((s, i) => (
          <div className="schedule-row" key={i}>
            <input
              aria-label={`Hora ${i + 1}`}
              type="time"
              value={s.time}
              onChange={(e) =>
                patch({
                  schedule: config.schedule.map((x, j) =>
                    j === i ? { ...x, time: e.target.value } : x,
                  ),
                })
              }
            />
            <input
              aria-label={`Actividad ${i + 1}`}
              value={s.label}
              onChange={(e) =>
                patch({
                  schedule: config.schedule.map((x, j) =>
                    j === i ? { ...x, label: e.target.value } : x,
                  ),
                })
              }
            />
            <button
              className="icon-button"
              aria-label={`Eliminar actividad ${i + 1}`}
              onClick={() =>
                patch({ schedule: config.schedule.filter((_, j) => j !== i) })
              }
            >
              ×
            </button>
          </div>
        ))}
        <button
          className="secondary"
          disabled={config.schedule.length >= 20}
          onClick={() =>
            patch({
              schedule: [
                ...config.schedule,
                { time: "17:00", label: "Nueva actividad" },
              ],
            })
          }
        >
          + Agregar actividad
        </button>
      </>
    );
  return null;
}
