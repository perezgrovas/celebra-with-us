"use client";
import { useState, useRef } from "react";
import {
  Smartphone,
  Monitor,
  Undo2,
  Redo2,
  Eye,
  MousePointer2,
  Image as ImageIcon,
  Type,
  Shapes,
  Palette,
  Film,
  LayoutTemplate,
  Layers,
  Plus,
  Trash2,
} from "lucide-react";
import Invitation from "../Invitation";
import FontPicker from "./FontPicker";
import {
  configSchema,
  defaultConfig,
  sectionLabels,
  type WeddingConfig,
  type SectionKey,
} from "@/lib/config";
import {
  sectionDesign,
  sectionDesignSchema,
  layerSchema,
  palettes,
  type DesignLayer,
  type SectionDesign,
  masks,
} from "@/lib/design";
import {
  doodleCategories,
  doodleNames,
  doodleSvg,
  type DoodleId,
} from "@/lib/doodles";
import type { Asset } from "@/lib/types";
import { uploadAsset } from "@/lib/services/weddings";
const tools = [
  { id: "sections", label: "Secciones", icon: Layers },
  { id: "layouts", label: "Acomodo", icon: LayoutTemplate },
  { id: "text", label: "Letras", icon: Type },
  { id: "doodles", label: "Doodles", icon: Shapes },
  { id: "photos", label: "Fotos", icon: ImageIcon },
  { id: "colors", label: "Colores", icon: Palette },
  { id: "background", label: "Fondos", icon: ImageIcon },
  { id: "video", label: "Video", icon: Film },
] as const;
const layoutNames = {
  center: "Centrado",
  "split-left": "Foto a la izquierda",
  "split-right": "Foto a la derecha",
  editorial: "Editorial",
  "photo-background": "Foto de fondo",
  card: "Tarjeta",
} as const;
const maskNames = {
  none: "Completa",
  rounded: "Esquinas suaves",
  arch: "Arco",
  circle: "Círculo",
  oval: "Óvalo",
  heart: "Corazón",
  diamond: "Rombo",
};
function Range({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="visual-range">
      <span>
        {label}
        <small>{Math.round(value * 100) / 100}</small>
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
export default function VisualEditor({
  config,
  onChange,
  assets,
  wid,
  refresh,
  report,
  guestPreview,
  closePreview,
  notice,
}: {
  notice: string;
  config: WeddingConfig;
  onChange: (c: WeddingConfig) => void;
  assets: Asset[];
  wid: string;
  refresh: () => Promise<void>;
  report: (m: string) => void;
  guestPreview: boolean;
  closePreview: () => void;
}) {
  const parsed = configSchema.safeParse(config);
  const lastValid = useRef<WeddingConfig>(defaultConfig);
  if (parsed.success) lastValid.current = parsed.data;
  const [tool, setTool] = useState<(typeof tools)[number]["id"]>("layouts");
  const [section, setSection] = useState<SectionKey>("hero");
  const [item, setItem] = useState<string | null>(null);
  const [viewport, setViewport] = useState<"mobile" | "desktop">("mobile");
  const [category, setCategory] =
    useState<keyof typeof doodleCategories>("Bodas");
  const [busy, setBusy] = useState(false);
  const [paletteName, setPaletteName] = useState("Mi paleta");
  const [custom, setCustom] = useState(false);
  const history = useRef<WeddingConfig[]>([]);
  const future = useRef<WeddingConfig[]>([]);
  const gesture = useRef(false);
  const [historyRevision, setHistoryRevision] = useState(0);
  void historyRevision;
  const safe = useRef(config);
  safe.current = config;
  const design = sectionDesign(config, section);
  const layer = config.design.layers.find((l) => l.id === item);
  const position = layer
    ? viewport === "mobile"
      ? layer.mobile || layer.position
      : layer.position
    : undefined;
  function change(c: WeddingConfig, coalesce = false) {
    if (!coalesce || !gesture.current) {
      history.current = [...history.current.slice(-29), safe.current];
      future.current = [];
      gesture.current = coalesce;
    }
    safe.current = c;
    onChange(c);
    setHistoryRevision((v) => v + 1);
  }
  function patch(p: Partial<WeddingConfig>) {
    change({ ...safe.current, ...p });
  }
  function style(p: Partial<SectionDesign>) {
    const current = safe.current;
    patch({
      design: {
        ...current.design,
        sections: {
          ...current.design.sections,
          [section]: { ...sectionDesign(current, section), ...p },
        },
      },
    });
  }
  function updateLayer(p: Partial<DesignLayer>) {
    if (!layer) return;
    patch({
      design: {
        ...config.design,
        layers: config.design.layers.map((l) =>
          l.id === layer.id ? { ...l, ...p } : l,
        ),
      },
    });
  }
  function select(s: string, id: string) {
    gesture.current = false;
    setSection(s as SectionKey);
    setItem(id);
    if (id === "photo") setTool("photos");
    else if (["names", "title", "body"].includes(id)) setTool("text");
    else if (config.design.layers.find((l) => l.id === id)?.kind === "photo")
      setTool("photos");
    else if (config.design.layers.find((l) => l.id === id)?.kind === "doodle")
      setTool("doodles");
  }
  function move(s: string, id: string, x: number, y: number) {
    const current = safe.current;
    const found = current.design.layers.find((l) => l.id === id);
    const clamp = (v: number, min: number, max: number) =>
      Math.max(min, Math.min(max, v));
    if (found) {
      const pos =
        viewport === "mobile" ? found.mobile || found.position : found.position;
      const p = { ...pos, x: clamp(x, 0, 100), y: clamp(y, 0, 100) };
      change(
        {
          ...current,
          design: {
            ...current.design,
            layers: current.design.layers.map((l) =>
              l.id === id
                ? {
                    ...l,
                    ...(viewport === "mobile"
                      ? { mobile: p }
                      : { position: p }),
                  }
                : l,
            ),
          },
        },
        true,
      );
    } else {
      const existing = sectionDesign(current, s);
      change(
        {
          ...current,
          design: {
            ...current.design,
            sections: {
              ...current.design.sections,
              [s]: {
                ...existing,
                shifts: {
                  ...existing.shifts,
                  [id]: { x: clamp(x, -35, 35), y: clamp(y, -35, 35) },
                },
              },
            },
          },
        },
        true,
      );
    }
  }
  function addLayer(
    kind: DesignLayer["kind"],
    extra: Partial<DesignLayer> = {},
  ) {
    const current = safe.current;
    if (current.design.layers.length >= 100) {
      report(
        "Puedes usar hasta 100 elementos. Quita uno antes de agregar otro.",
      );
      return;
    }
    const l = layerSchema.parse({
      id: crypto.randomUUID(),
      section,
      kind,
      text: kind === "text" ? "Escribe algo bonito" : "",
      font: current.fonts.title,
      ...extra,
    });
    patch({
      design: { ...current.design, layers: [...current.design.layers, l] },
    });
    setItem(l.id);
  }
  function undo() {
    const prev = history.current.pop();
    if (!prev) return;
    future.current.push(config);
    onChange(prev);
    safe.current = prev;
    setHistoryRevision((v) => v + 1);
    setItem(null);
    gesture.current = false;
  }
  function redo() {
    const next = future.current.pop();
    if (!next) return;
    history.current.push(config);
    onChange(next);
    safe.current = next;
    setHistoryRevision((v) => v + 1);
    setItem(null);
    gesture.current = false;
  }
  function toggle(key: SectionKey, on: boolean) {
    let sections = config.sections;
    if (!sections.some((s) => s.key === key))
      sections = [...sections, { key, enabled: on }];
    else
      sections = sections.map((s) =>
        s.key === key ? { ...s, enabled: on } : s,
      );
    patch({ sections });
  }
  function reorder(index: number, delta: number) {
    const sections = [...config.sections];
    [sections[index], sections[index + delta]] = [
      sections[index + delta],
      sections[index],
    ];
    patch({ sections });
  }
  function jump(key: SectionKey) {
    setSection(key);
    setItem(null);
    document
      .querySelector(`.design-stage [data-section="${key}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  async function upload(
    file: File,
    kind: "photo" | "background" | "sticker" | "video",
  ) {
    setBusy(true);
    try {
      const a = await uploadAsset(wid, file, kind);
      await refresh();
      if (kind === "background") patch({ backgroundAssetId: a.id });
      else if (kind === "sticker") addLayer("photo", { assetId: a.id });
      else if (kind === "video") {
        const current = safe.current;
        let sections = current.sections.map((s) =>
          s.key === "video" ? { ...s, enabled: true } : s,
        );
        if (!sections.some((s) => s.key === "video"))
          sections = [...sections, { key: "video", enabled: true }];
        patch({
          sections,
          design: {
            ...current.design,
            video: { ...current.design.video, assetId: a.id, url: "" },
          },
        });
      } else if (section === "gallery") {
        const current = safe.current;
        patch({ gallery: [...new Set([...current.gallery, a.id])] });
      } else style({ imageAssetId: a.id });
      report("Archivo guardado. Ya puedes acomodarlo.");
    } catch (e) {
      report(e instanceof Error ? e.message : "No se pudo subir el archivo.");
    } finally {
      setBusy(false);
    }
  }
  const photos = assets.filter(
    (a) => a.kind === "photo" || a.kind === "sticker",
  );
  function textControl() {
    if (layer?.kind === "text")
      return (
        <>
          <label className="field">
            <span>Tu texto</span>
            <textarea
              aria-label="Texto del elemento"
              value={layer.text}
              onChange={(e) => updateLayer({ text: e.target.value })}
            />
          </label>
          <FontPicker
            value={layer.font}
            assets={assets}
            onChange={(font) => updateLayer({ font })}
          />
          <Range
            label="Tamaño de letra"
            value={layer.size}
            min={12}
            max={120}
            onChange={(size) => updateLayer({ size })}
          />
        </>
      );
    if (item === "names")
      return (
        <div className="form-grid">
          <label className="field">
            <span>Nombre de la novia</span>
            <input
              value={config.couple.bride}
              onChange={(e) =>
                patch({ couple: { ...config.couple, bride: e.target.value } })
              }
            />
          </label>
          <label className="field">
            <span>Nombre del novio</span>
            <input
              value={config.couple.groom}
              onChange={(e) =>
                patch({ couple: { ...config.couple, groom: e.target.value } })
              }
            />
          </label>
        </div>
      );
    if (item === "title")
      return (
        <label className="field">
          <span>Título de la sección</span>
          <input
            aria-label="Título de la sección"
            value={
              design.heading ??
              (section === "story"
                ? config.content.storyTitle
                : sectionLabels[section])
            }
            maxLength={200}
            onChange={(e) => style({ heading: e.target.value })}
          />
        </label>
      );
    const field = (
      {
        story: item === "body" ? "story" : "storyTitle",
        dresscode: "dresscode",
        lodging: "lodging",
        gifts: "gifts",
        final: "final",
      } as Record<string, keyof WeddingConfig["content"]>
    )[section];
    if (field)
      return (
        <label className="field">
          <span>
            {item === "title" ? "Título de la sección" : "Texto de la sección"}
          </span>
          <textarea
            value={config.content[field]}
            onChange={(e) =>
              patch({ content: { ...config.content, [field]: e.target.value } })
            }
          />
        </label>
      );
    return (
      <p className="hint">
        Selecciona un texto en la invitación para acomodarlo. Los datos del
        evento se cambian en «Detalles del día».
      </p>
    );
  }
  const fontFamilies = ["title", "subtitle", "body", "button"] as const;
  const inspector = layer && (
    <div className="element-inspector">
      <div className="inspector-title">
        <b>Elemento seleccionado</b>
        <button
          className="icon-button"
          aria-label="Eliminar elemento"
          onClick={() => {
            patch({
              design: {
                ...config.design,
                layers: config.design.layers.filter((l) => l.id !== layer.id),
              },
            });
            setItem(null);
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
      {layer.kind === "text" && textControl()}
      <Range
        label="Tamaño del elemento"
        value={position!.width}
        min={5}
        max={100}
        onChange={(width) =>
          updateLayer(
            viewport === "mobile"
              ? { mobile: { ...position!, width } }
              : { position: { ...position!, width } },
          )
        }
      />
      <Range
        label="Girar"
        value={layer.rotation}
        min={-180}
        max={180}
        onChange={(rotation) => updateLayer({ rotation })}
      />
      <Range
        label="Transparencia"
        value={layer.opacity}
        min={0.1}
        max={1}
        step={0.05}
        onChange={(opacity) => updateLayer({ opacity })}
      />
      {layer.kind !== "photo" && (
        <label className="field">
          <span>Color del elemento</span>
          <input
            type="color"
            value={layer.color}
            onChange={(e) => updateLayer({ color: e.target.value })}
          />
        </label>
      )}
      <div className="form-grid">
        <label className="field">
          <span>Posición horizontal</span>
          <input
            aria-label="Posición horizontal"
            type="number"
            min={0}
            max={100}
            value={Math.round(position!.x)}
            onChange={(e) =>
              updateLayer(
                viewport === "mobile"
                  ? {
                      mobile: {
                        ...position!,
                        x: Math.max(0, Math.min(100, Number(e.target.value))),
                      },
                    }
                  : {
                      position: {
                        ...position!,
                        x: Math.max(0, Math.min(100, Number(e.target.value))),
                      },
                    },
              )
            }
          />
        </label>
        <label className="field">
          <span>Posición vertical</span>
          <input
            aria-label="Posición vertical"
            type="number"
            min={0}
            max={100}
            value={Math.round(position!.y)}
            onChange={(e) =>
              updateLayer(
                viewport === "mobile"
                  ? {
                      mobile: {
                        ...position!,
                        y: Math.max(0, Math.min(100, Number(e.target.value))),
                      },
                    }
                  : {
                      position: {
                        ...position!,
                        y: Math.max(0, Math.min(100, Number(e.target.value))),
                      },
                    },
              )
            }
          />
        </label>
      </div>
      <small>El acomodo en celular se guarda aparte del escritorio.</small>
    </div>
  );
  return (
    <div
      className={`visual-editor ${guestPreview ? "guest-view-open" : ""}`}
      onPointerUp={() => {
        gesture.current = false;
      }}
    >
      <div className="canvas-toolbar">
        <div>
          <b>Diseña a tu manera</b>
          <small>Elige una sección y toca lo que quieras cambiar.</small>
        </div>
        <div className="canvas-toolbar-actions">
          <div className="view-toggle">
            <button
              aria-label="Vista de celular"
              aria-pressed={viewport === "mobile"}
              onClick={() => setViewport("mobile")}
            >
              <Smartphone size={17} />
              Celular
            </button>
            <button
              aria-label="Vista de escritorio"
              aria-pressed={viewport === "desktop"}
              onClick={() => setViewport("desktop")}
            >
              <Monitor size={17} />
              Escritorio
            </button>
          </div>
          <button
            className="icon-button"
            aria-label="Deshacer"
            disabled={!history.current.length}
            onClick={undo}
          >
            <Undo2 size={17} />
          </button>
          <button
            className="icon-button"
            aria-label="Rehacer"
            disabled={!future.current.length}
            onClick={redo}
          >
            <Redo2 size={17} />
          </button>
          {guestPreview && (
            <button className="secondary" onClick={closePreview}>
              Volver a editar
            </button>
          )}
        </div>
        {notice && (
          <div className="canvas-feedback" role="status">
            {notice}
          </div>
        )}
      </div>
      {!guestPreview && (
        <div className="visual-tools">
          <div className="tool-icons">
            {tools.map((t) => (
              <button
                key={t.id}
                aria-pressed={tool === t.id}
                onClick={() => setTool(t.id)}
              >
                <t.icon size={18} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
          <div className="tool-content">
            <label className="field">
              <span>Estás diseñando</span>
              <select
                aria-label="Sección a diseñar"
                value={section}
                onChange={(e) => jump(e.target.value as SectionKey)}
              >
                {config.sections.map((s) => (
                  <option value={s.key} key={s.key}>
                    {sectionLabels[s.key]}
                    {!s.enabled ? " (oculta)" : ""}
                  </option>
                ))}
              </select>
            </label>
            {!config.sections.some((s) => s.key === section && s.enabled) && (
              <button onClick={() => toggle(section, true)}>
                Mostrar esta sección
              </button>
            )}
            {tool === "sections" && (
              <>
                <h2>¿Qué quieres compartir?</h2>
                <p className="hint">
                  Puedes ocultar y volver a mostrar cualquier sección.
                </p>
                <div className="visual-section-list">
                  {config.sections.map((s, i) => (
                    <div
                      key={s.key}
                      className={section === s.key ? "selected" : ""}
                    >
                      <button
                        className="section-name"
                        onClick={() => jump(s.key)}
                      >
                        {sectionLabels[s.key]}
                      </button>
                      <input
                        aria-label={`Mostrar ${sectionLabels[s.key]}`}
                        type="checkbox"
                        checked={s.enabled}
                        onChange={(e) => toggle(s.key, e.target.checked)}
                      />
                      <button
                        aria-label={`Subir ${sectionLabels[s.key]}`}
                        disabled={i === 0}
                        onClick={() => reorder(i, -1)}
                      >
                        ↑
                      </button>
                      <button
                        aria-label={`Bajar ${sectionLabels[s.key]}`}
                        disabled={i === config.sections.length - 1}
                        onClick={() => reorder(i, 1)}
                      >
                        ↓
                      </button>
                    </div>
                  ))}
                </div>
                {!config.sections.some((s) => s.key === "video") && (
                  <button
                    className="secondary"
                    onClick={() => {
                      toggle("video", true);
                      setSection("video");
                      setTool("video");
                    }}
                  >
                    + Agregar video
                  </button>
                )}
              </>
            )}
            {tool === "layouts" && (
              <>
                <h2>Un buen punto de partida</h2>
                <p className="hint">
                  Aplica un acomodo y después mueve sus elementos a tu gusto.
                </p>
                <div className="layout-options">
                  {Object.entries(layoutNames).map(([id, label]) => (
                    <button
                      key={id}
                      aria-pressed={design.layout === id}
                      className={`layout-choice choice-${id}`}
                      onClick={() =>
                        style({ layout: id as SectionDesign["layout"] })
                      }
                    >
                      <div className="layout-mini">
                        <i />
                        <div>
                          <b />
                          <b />
                          <b />
                        </div>
                      </div>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                <details>
                  <summary>Espacios y alineación</summary>
                  <Range
                    label="Espacio de la sección"
                    value={design.padding}
                    min={24}
                    max={180}
                    onChange={(padding) => style({ padding })}
                  />
                  <div className="segmented">
                    {(["left", "center", "right"] as const).map((a, i) => (
                      <button
                        key={a}
                        aria-pressed={design.align === a}
                        onClick={() => style({ align: a })}
                      >
                        {["Izquierda", "Centro", "Derecha"][i]}
                      </button>
                    ))}
                  </div>
                  <button
                    className="secondary"
                    onClick={() => style({ shifts: {} })}
                  >
                    Restablecer posiciones
                  </button>
                </details>
              </>
            )}
            {tool === "text" && (
              <>
                <h2>Las letras de tu historia</h2>
                {!layer && textControl()}
                <button
                  className="secondary add-element"
                  onClick={() =>
                    addLayer("text", { position: { x: 50, y: 12, width: 60 } })
                  }
                >
                  <Plus size={16} />
                  Agregar texto libre
                </button>
                {!layer && (
                  <>
                    <Range
                      label="Tamaño de títulos"
                      value={design.titleSize}
                      min={24}
                      max={100}
                      onChange={(titleSize) => style({ titleSize })}
                    />
                    <Range
                      label="Tamaño de texto"
                      value={design.bodySize}
                      min={12}
                      max={28}
                      onChange={(bodySize) => style({ bodySize })}
                    />
                    <details open>
                      <summary>Tipografías de la invitación</summary>
                      {fontFamilies.map((f) => (
                        <div className="font-role" key={f}>
                          <small>
                            {
                              {
                                title: "Títulos",
                                subtitle: "Subtítulos",
                                body: "Contenido",
                                button: "Botones",
                              }[f]
                            }
                          </small>
                          <FontPicker
                            value={config.fonts[f]}
                            assets={assets}
                            onChange={(font) =>
                              patch({ fonts: { ...config.fonts, [f]: font } })
                            }
                          />
                        </div>
                      ))}
                    </details>
                  </>
                )}
              </>
            )}
            {tool === "doodles" && (
              <>
                <h2>Un toque de personalidad</h2>
                <select
                  aria-label="Categoría de doodles"
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as typeof category)
                  }
                >
                  {Object.keys(doodleCategories).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <div className="doodle-grid">
                  {doodleCategories[category].map((id) => (
                    <button
                      aria-label={`Agregar ${doodleNames[id]}`}
                      key={id}
                      onClick={() =>
                        addLayer("doodle", {
                          doodleId: id,
                          color: config.colors.accent,
                        })
                      }
                    >
                      <img src={doodleSvg(id, config.colors.accent)} alt="" />
                      <span>{doodleNames[id]}</span>
                    </button>
                  ))}
                </div>
                <label className="upload-sticker">
                  + Subir mi sticker (PNG transparente)
                  <input
                    aria-label="Subir sticker"
                    disabled={busy}
                    type="file"
                    accept=".png,.webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void upload(f, "sticker");
                      e.target.value = "";
                    }}
                  />
                </label>
                <p className="hint">
                  Arrastra el doodle sobre la sección. Usa sus ajustes para
                  girarlo o cambiarle el color.
                </p>
              </>
            )}
            {tool === "photos" && (
              <>
                <h2>Fotos que se vean bien</h2>
                <label className="upload-sticker">
                  + Subir una foto
                  <input
                    aria-label="Subir foto al diseño"
                    disabled={busy}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void upload(f, "photo");
                      e.target.value = "";
                    }}
                  />
                </label>
                <div className="photo-library">
                  {photos.map((a) => (
                    <button
                      key={a.id}
                      aria-label={`Usar ${a.name}`}
                      aria-pressed={
                        section === "gallery" && !layer
                          ? config.gallery.includes(a.id)
                          : design.imageAssetId === a.id
                      }
                      onClick={() =>
                        layer?.kind === "photo"
                          ? updateLayer({ assetId: a.id })
                          : section === "gallery"
                            ? patch({
                                gallery: config.gallery.includes(a.id)
                                  ? config.gallery.filter((id) => id !== a.id)
                                  : [...config.gallery, a.id],
                              })
                            : style({ imageAssetId: a.id })
                      }
                    >
                      <img src={a.url} alt={a.alt} />
                    </button>
                  ))}
                </div>
                {section === "gallery" && (
                  <>
                    <h3>Tu galería</h3>
                    <p className="hint">
                      Marca las fotos que quieres mostrar. Las flechas cambian
                      su orden.
                    </p>
                    {photos
                      .filter((a) => a.kind === "photo")
                      .map((a) => (
                        <div className="gallery-select" key={a.id}>
                          <label>
                            <input
                              type="checkbox"
                              checked={config.gallery.includes(a.id)}
                              onChange={(e) =>
                                patch({
                                  gallery: e.target.checked
                                    ? [...config.gallery, a.id]
                                    : config.gallery.filter(
                                        (id) => id !== a.id,
                                      ),
                                })
                              }
                            />
                            {a.name}
                          </label>
                          {config.gallery.includes(a.id) && (
                            <>
                              <button
                                className="icon-button"
                                disabled={config.gallery.indexOf(a.id) === 0}
                                aria-label={`Adelantar ${a.name}`}
                                onClick={() => {
                                  const order = [...config.gallery];
                                  const i = order.indexOf(a.id);
                                  [order[i], order[i - 1]] = [
                                    order[i - 1],
                                    order[i],
                                  ];
                                  patch({ gallery: order });
                                }}
                              >
                                ↑
                              </button>
                              <button
                                className="icon-button"
                                disabled={
                                  config.gallery.indexOf(a.id) ===
                                  config.gallery.length - 1
                                }
                                aria-label={`Atrasar ${a.name}`}
                                onClick={() => {
                                  const order = [...config.gallery];
                                  const i = order.indexOf(a.id);
                                  [order[i], order[i + 1]] = [
                                    order[i + 1],
                                    order[i],
                                  ];
                                  patch({ gallery: order });
                                }}
                              >
                                ↓
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    <label className="field">
                      <span>Cómo se muestran</span>
                      <select
                        value={config.design.galleryMode}
                        onChange={(e) =>
                          patch({
                            design: {
                              ...config.design,
                              galleryMode: e.target.value as
                                "carousel" | "grid" | "mosaic",
                            },
                          })
                        }
                      >
                        <option value="carousel">Carrusel para deslizar</option>
                        <option value="grid">Cuadrícula ordenada</option>
                        <option value="mosaic">Mosaico</option>
                      </select>
                    </label>
                  </>
                )}
                <h3>Forma de la foto</h3>
                <div className="mask-options">
                  {masks.map((m) => (
                    <button
                      key={m}
                      aria-label={`Máscara ${maskNames[m]}`}
                      aria-pressed={
                        (layer?.kind === "photo" ? layer.mask : design.mask) ===
                        m
                      }
                      onClick={() =>
                        layer?.kind === "photo"
                          ? updateLayer({ mask: m })
                          : style({ mask: m })
                      }
                    >
                      <i data-mask={m} />
                      <span>{maskNames[m]}</span>
                    </button>
                  ))}
                </div>
                <label className="field">
                  <span>Encuadre</span>
                  <select
                    value={
                      section === "gallery"
                        ? config.design.galleryFit
                        : design.fit
                    }
                    onChange={(e) =>
                      section === "gallery"
                        ? patch({
                            design: {
                              ...config.design,
                              galleryFit: e.target.value as "cover" | "contain",
                            },
                          })
                        : style({ fit: e.target.value as "cover" | "contain" })
                    }
                  >
                    <option value="contain">Ver foto completa</option>
                    <option value="cover">Llenar el espacio</option>
                  </select>
                </label>
                <Range
                  label="Altura de las fotos"
                  value={
                    section === "gallery"
                      ? config.design.galleryHeight
                      : design.imageHeight
                  }
                  min={160}
                  max={700}
                  onChange={(n) =>
                    section === "gallery"
                      ? patch({
                          design: { ...config.design, galleryHeight: n },
                        })
                      : style({ imageHeight: n })
                  }
                />
                <Range
                  label="Encuadre horizontal"
                  value={design.focalX}
                  min={0}
                  max={100}
                  onChange={(focalX) => style({ focalX })}
                />
                <Range
                  label="Encuadre vertical"
                  value={design.focalY}
                  min={0}
                  max={100}
                  onChange={(focalY) => style({ focalY })}
                />
                <button
                  className="secondary"
                  onClick={() => {
                    const current = safe.current;
                    patch({
                      ...(section === "hero" ? { heroAssetId: null } : {}),
                      design: {
                        ...current.design,
                        sections: {
                          ...current.design.sections,
                          [section]: {
                            ...sectionDesign(current, section),
                            imageAssetId: null,
                          },
                        },
                      },
                    });
                  }}
                >
                  Quitar foto de la sección
                </button>
              </>
            )}
            {tool === "colors" && (
              <>
                <h2>Colores que combinan</h2>
                <div className="palette-options">
                  {[...palettes, ...config.design.customPalettes].map(
                    (p, i) => (
                      <button
                        key={p.name + i}
                        onClick={() => patch({ colors: p.colors })}
                      >
                        <div>
                          {Object.values(p.colors).map((c, j) => (
                            <i key={j} style={{ background: c }} />
                          ))}
                        </div>
                        <span>{p.name}</span>
                      </button>
                    ),
                  )}
                </div>
                <button
                  className="secondary"
                  onClick={() => setCustom(!custom)}
                >
                  + Crea tu paleta de color
                </button>
                {custom && (
                  <div className="custom-palette">
                    <input
                      aria-label="Nombre de la paleta"
                      value={paletteName}
                      onChange={(e) => setPaletteName(e.target.value)}
                      maxLength={50}
                    />
                    {Object.entries(config.colors).map(([k, v]) => (
                      <label className="color-line" key={k}>
                        <span>
                          {
                            {
                              bg: "Fondo",
                              text: "Letras",
                              accent: "Detalles",
                              soft: "Bordes",
                              button: "Botones",
                            }[k]
                          }
                        </span>
                        <input
                          aria-label={`Color de ${k}`}
                          type="color"
                          value={v}
                          onChange={(e) =>
                            patch({
                              colors: { ...config.colors, [k]: e.target.value },
                            })
                          }
                        />
                        <code>{v}</code>
                      </label>
                    ))}
                    <button
                      disabled={
                        !paletteName.trim() ||
                        config.design.customPalettes.length >= 12
                      }
                      onClick={() =>
                        patch({
                          design: {
                            ...config.design,
                            customPalettes: [
                              ...config.design.customPalettes,
                              {
                                name: paletteName.trim(),
                                colors: { ...config.colors },
                              },
                            ],
                          },
                        })
                      }
                    >
                      Guardar mi paleta
                    </button>
                  </div>
                )}
                <p className="hint">
                  La paleta se aplica a toda la invitación. Puedes cambiar el
                  fondo de una sección por separado.
                </p>
              </>
            )}
            {tool === "background" && (
              <>
                <h2>El fondo de tu celebración</h2>
                <div className="texture-options">
                  {(["ivory", "paper", "linen", "sage", "blush"] as const).map(
                    (b, i) => (
                      <button
                        key={b}
                        className={`bg-${b}`}
                        onClick={() =>
                          patch({ background: b, backgroundAssetId: null })
                        }
                      >
                        {["Marfil", "Papel", "Lino", "Salvia", "Rosa"][i]}
                      </button>
                    ),
                  )}
                </div>
                <label className="upload-sticker">
                  + Subir fondo
                  <input
                    disabled={busy}
                    aria-label="Subir fondo"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void upload(f, "background");
                      e.target.value = "";
                    }}
                  />
                </label>
                <div className="photo-library">
                  {assets
                    .filter((a) => a.kind === "background")
                    .map((a) => (
                      <button
                        key={a.id}
                        aria-label={`Fondo ${a.name}`}
                        onClick={() => patch({ backgroundAssetId: a.id })}
                      >
                        <img src={a.url} alt={a.alt} />
                      </button>
                    ))}
                </div>
                <label className="field">
                  <span>Cómo se acomoda</span>
                  <select
                    value={config.backgroundMode}
                    onChange={(e) =>
                      patch({
                        backgroundMode: e.target.value as "cover" | "repeat",
                      })
                    }
                  >
                    <option value="repeat">Mosaico continuo</option>
                    <option value="cover">Cubrir toda la página</option>
                  </select>
                </label>
                <label className="color-line">
                  <span>Fondo solo de esta sección</span>
                  <input
                    aria-label="Fondo de esta sección"
                    type="color"
                    value={design.background || config.colors.bg}
                    onChange={(e) => style({ background: e.target.value })}
                  />
                </label>
                <button
                  className="secondary"
                  onClick={() => {
                    style({ background: undefined });
                  }}
                >
                  Usar fondo general
                </button>
              </>
            )}
            {tool === "video" && (
              <>
                <h2>Un recuerdo en movimiento</h2>
                <p className="hint">
                  Agrega un enlace de YouTube o Vimeo, o sube un MP4. No se
                  reproduce solo.
                </p>
                <label className="field">
                  <span>Enlace del video</span>
                  <input
                    placeholder="https://www.youtube.com/watch?v=…"
                    value={config.design.video.url}
                    onChange={(e) =>
                      patch({
                        design: {
                          ...config.design,
                          video: {
                            ...config.design.video,
                            url: e.target.value,
                            assetId: null,
                          },
                        },
                      })
                    }
                  />
                </label>
                <label className="upload-sticker">
                  + Subir video (máx. 50 MB)
                  <input
                    aria-label="Subir video"
                    disabled={busy}
                    type="file"
                    accept=".mp4,.webm"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void upload(f, "video");
                      e.target.value = "";
                    }}
                  />
                </label>
                <select
                  aria-label="Video guardado"
                  value={config.design.video.assetId || ""}
                  onChange={(e) =>
                    patch({
                      design: {
                        ...config.design,
                        video: {
                          ...config.design.video,
                          assetId: e.target.value || null,
                          url: "",
                        },
                      },
                    })
                  }
                >
                  <option value="">Elige un video guardado</option>
                  {assets
                    .filter((a) => a.kind === "video")
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
                <label className="field">
                  <span>Título del video</span>
                  <input
                    value={config.design.video.caption}
                    onChange={(e) =>
                      patch({
                        design: {
                          ...config.design,
                          video: {
                            ...config.design.video,
                            caption: e.target.value,
                          },
                        },
                      })
                    }
                  />
                </label>
                <button
                  onClick={() => {
                    toggle("video", true);
                    setSection("video");
                  }}
                >
                  Mostrar sección de video
                </button>
                <button
                  className="secondary"
                  onClick={() => toggle("video", false)}
                >
                  Ocultar video
                </button>
              </>
            )}
            {inspector}
            {busy && <p role="status">Subiendo tu archivo…</p>}
          </div>
        </div>
      )}
      <div className="design-stage">
        <div className="stage-hint">
          <MousePointer2 size={14} />
          {guestPreview
            ? "Así la verá tu invitado"
            : "Toca para editar · arrastra para mover"}
        </div>
        <div className={`canvas-device ${viewport}`}>
          <Invitation
            config={lastValid.current}
            assets={assets}
            preview
            editing={
              guestPreview
                ? undefined
                : { section, item, viewport, select, move }
            }
          />
        </div>
      </div>
    </div>
  );
}
