"use client";
import { useState } from "react";
import { uploadAsset } from "@/lib/services/weddings";
import { getBrowserClient } from "@/lib/supabase/client";
import type { Asset, AssetKind } from "@/lib/types";
import type { WeddingConfig } from "@/lib/config";
import { Field } from "./ConfigEditor";
export default function AssetsPanel({
  wid,
  assets,
  config,
  onChange,
  refresh,
  report,
}: {
  wid: string;
  assets: Asset[];
  config: WeddingConfig;
  onChange: (c: WeddingConfig) => void;
  refresh: () => Promise<void>;
  report: (m: string) => void;
}) {
  const [kind, setKind] = useState<AssetKind>("photo");
  const [busy, setBusy] = useState(false);
  async function upload(file: File) {
    setBusy(true);
    try {
      await uploadAsset(wid, file, kind);
      await refresh();
      report("Archivo guardado. Ya puedes usarlo en tu invitación.");
    } catch (e) {
      report(e instanceof Error ? e.message : "No se pudo subir el archivo.");
    } finally {
      setBusy(false);
    }
  }
  async function alt(id: string, value: string) {
    const { error } = await getBrowserClient()
      .from("assets")
      .update({ alt: value })
      .eq("id", id);
    if (error) report(error.message);
    else await refresh();
  }
  return (
    <>
      <p className="hint">
        Las fotos, fondos y fuentes quedan disponibles desde cualquier
        dispositivo. Los archivos visuales se sirven mediante enlaces públicos;
        sube solo material para compartir.
      </p>
      <div className="upload-box">
        <Field label="Tipo de archivo">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as AssetKind)}
          >
            <option value="photo">Foto</option>
            <option value="background">Fondo</option>
            <option value="font">Tipografía</option>
            <option value="sticker">Sticker transparente</option>
            <option value="video">Video</option>
          </select>
        </Field>
        <Field
          label={busy ? "Subiendo…" : "Selecciona un archivo (máx. 10 MB)"}
        >
          <input
            disabled={busy}
            type="file"
            accept={
              kind === "video"
                ? ".mp4,.webm"
                : kind === "font"
                  ? ".woff2,.woff,.ttf,.otf"
                  : ".jpg,.jpeg,.png,.webp"
            }
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = "";
            }}
          />
        </Field>
        <small>
          {kind === "font"
            ? "WOFF2 recomendado; también WOFF, TTF y OTF."
            : "JPG, PNG o WebP. Para fondos en mosaico, usa una textura sin bordes."}
        </small>
      </div>
      <div className="asset-grid">
        {assets.map((a) => (
          <article className="asset-card" key={a.id}>
            {a.kind === "font" ? (
              <div
                className="font-tile"
                style={{ fontFamily: a.family || "Georgia" }}
              >
                Aa
              </div>
            ) : a.kind === "video" ? (
              <video src={a.url} controls preload="metadata" />
            ) : (
              <img src={a.url} alt={a.alt} />
            )}
            <strong>{a.name}</strong>
            <small>
              {
                {
                  photo: "Foto",
                  background: "Fondo",
                  font: "Tipografía",
                  sticker: "Sticker",
                  video: "Video",
                }[a.kind]
              }
            </small>
            {a.kind === "photo" && (
              <>
                <label className="check-line">
                  <input
                    type="checkbox"
                    checked={config.gallery.includes(a.id)}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        gallery: e.target.checked
                          ? [...config.gallery, a.id]
                          : config.gallery.filter((id) => id !== a.id),
                      })
                    }
                  />
                  Incluir en galería
                </label>
                <Field label="Descripción para accesibilidad">
                  <input
                    key={a.alt}
                    defaultValue={a.alt}
                    maxLength={250}
                    onBlur={(e) => {
                      if (e.target.value !== a.alt)
                        void alt(a.id, e.target.value);
                    }}
                  />
                </Field>
              </>
            )}
            {a.kind === "background" && (
              <button
                className="secondary"
                onClick={() => onChange({ ...config, backgroundAssetId: a.id })}
              >
                Usar como fondo
              </button>
            )}
          </article>
        ))}
      </div>
      {assets.length === 0 && (
        <div className="empty-card">
          Aquí aparecerán tus archivos. Empieza con una foto de ustedes.
        </div>
      )}
    </>
  );
}
