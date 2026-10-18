"use client";
import type { CSSProperties } from "react";
import Countdown from "./Countdown";
import Rsvp from "./Rsvp";
import AssetFonts from "./AssetFonts";
import FontLibrary from "./FontLibrary";
import PhotoGallery from "./PhotoGallery";
import Movable, { type CanvasEditing } from "./editor/Movable";
import {
  eventInstant,
  formatDate,
  sectionLabels,
  type WeddingConfig,
  type SectionKey,
} from "@/lib/config";
import { sectionDesign, videoEmbed, type DesignLayer } from "@/lib/design";
import { doodleSvg, doodleNames, type DoodleId } from "@/lib/doodles";
import type { Asset, PublicGuest } from "@/lib/types";
export default function Invitation({
  config,
  assets = [],
  guests = [],
  token,
  groupName,
  preview = false,
  editing,
}: {
  config: WeddingConfig;
  assets?: Asset[];
  guests?: PublicGuest[];
  token?: string;
  groupName?: string;
  preview?: boolean;
  editing?: CanvasEditing;
}) {
  const asset = (id: string | null | undefined) =>
    assets.find((a) => a.id === id);
  const background = asset(config.backgroundAssetId);
  const vars = {
    "--name-length": Math.max(
      config.couple.bride.length,
      config.couple.groom.length,
      4,
    ),
    "--bg": config.colors.bg,
    "--text": config.colors.text,
    "--accent": config.colors.accent,
    "--soft": config.colors.soft,
    "--button": config.colors.button,
    "--font-title": config.fonts.title,
    "--font-subtitle": config.fonts.subtitle,
    "--font-body": config.fonts.body,
    "--font-button": config.fonts.button,
    ...(background
      ? {
          backgroundImage: `url(${JSON.stringify(background.url)})`,
          backgroundSize:
            config.backgroundMode === "repeat" ? "480px auto" : "cover",
          backgroundRepeat:
            config.backgroundMode === "repeat" ? "repeat" : "no-repeat",
        }
      : {}),
  } as CSSProperties;
  const dates = formatDate(config);
  function layerStyle(layer: DesignLayer) {
    return {
      "--layer-x": layer.position.x + "%",
      "--layer-y": layer.position.y + "%",
      "--layer-width": layer.position.width + "%",
      "--layer-mx": (layer.mobile || layer.position).x + "%",
      "--layer-my": (layer.mobile || layer.position).y + "%",
      "--layer-mwidth": (layer.mobile || layer.position).width + "%",
      transform: `translate(-50%,-50%) rotate(${layer.rotation}deg)`,
      opacity: layer.opacity,
      fontFamily: layer.font,
      color: layer.color,
      fontSize: layer.size,
    } as CSSProperties;
  }
  function renderSection(key: SectionKey) {
    const s = sectionDesign(config, key);
    const photo =
      asset(s.imageAssetId) ||
      (key === "hero" ? asset(config.heroAssetId) : undefined);
    const keyTitle = key === "hero" ? "names" : "title";
    const move = (id: string, children: React.ReactNode) => (
      <Movable
        section={key}
        id={id}
        editing={editing}
        position={s.shifts[id]}
        className="base-item"
      >
        {children}
      </Movable>
    );
    const titles: Record<SectionKey, string> = {
      hero: `${config.couple.bride} & ${config.couple.groom}`,
      countdown: "Nos vemos en…",
      story: config.content.storyTitle,
      gallery: "Un poquito de nosotros",
      schedule: "El gran día",
      location: config.couple.venue,
      dresscode: "Formal cómodo",
      lodging: "Quédate cerca",
      gifts: "Tu presencia es el mejor regalo",
      rsvp: "¿Nos acompañas?",
      final: `${config.couple.bride} & ${config.couple.groom}`,
      video: config.design.video.caption,
    };
    const paragraphs: Partial<Record<SectionKey, string>> = {
      story: config.content.story,
      dresscode: config.content.dresscode,
      lodging: config.content.lodging,
      gifts: config.content.gifts,
      final: config.content.final,
      location: config.couple.city,
    };
    const image = key !== "gallery" && photo && (
      <Movable
        section={key}
        id="photo"
        editing={editing}
        position={s.shifts.photo}
        className="section-photo base-item"
      >
        <div
          className="masked-photo"
          data-mask={s.mask}
          style={{ height: s.imageHeight }}
        >
          <img
            src={photo.url}
            alt={photo.alt}
            loading={key === "hero" ? "eager" : "lazy"}
            style={{
              objectFit: s.fit,
              objectPosition: `${s.focalX}% ${s.focalY}%`,
            }}
          />
        </div>
      </Movable>
    );
    const title = move(
      keyTitle,
      key === "hero" ? (
        <h1>
          {config.couple.bride}
          <span>&</span>
          {config.couple.groom}
        </h1>
      ) : (
        <h2>{s.heading || titles[key]}</h2>
      ),
    );
    const body = (
      <div className="section-content">
        {key !== "hero" && <p className="kicker">{sectionLabels[key]}</p>}
        {title}
        {paragraphs[key] && move("body", <p>{paragraphs[key]}</p>)}
        {key === "hero" && (
          <>
            {move(
              "body",
              <>
                <p className="date-line">{dates}</p>
                <p>
                  {config.couple.venue}
                  <br />
                  {config.couple.city}
                </p>
              </>,
            )}
            {groupName && (
              <p className="personal-note">Con mucho cariño para {groupName}</p>
            )}
            {config.sections.some((x) => x.key === "rsvp" && x.enabled) && (
              <a className="text-link" href="#rsvp">
                Confirma tu asistencia ↓
              </a>
            )}
          </>
        )}
        {key === "countdown" && <Countdown instant={eventInstant(config)} />}
        {key === "gallery" && (
          <PhotoGallery
            photos={config.gallery
              .map((id) => asset(id))
              .filter((p): p is Asset => Boolean(p))}
            mode={config.design.galleryMode}
            fit={config.design.galleryFit}
            height={config.design.galleryHeight}
            mask={s.mask}
            focalX={s.focalX}
            focalY={s.focalY}
          />
        )}
        {key === "gallery" && !config.gallery.length && editing && (
          <div className="canvas-placeholder">
            Agrega fotos desde «Fotos» para empezar tu galería.
          </div>
        )}
        {key === "schedule" && (
          <div className="timeline">
            {config.schedule.map((x, i) => (
              <div key={i}>
                <time>{x.time}</time>
                <span>{x.label}</span>
              </div>
            ))}
          </div>
        )}
        {key === "location" && config.content.mapUrl && (
          <a
            className="invite-button"
            href={config.content.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Cómo llegar ↗
          </a>
        )}
        {key === "gifts" && config.content.giftsUrl && (
          <a
            className="invite-button"
            href={config.content.giftsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver opciones ↗
          </a>
        )}
        {key === "rsvp" && (
          <>
            <p>
              Confirma antes del{" "}
              {new Intl.DateTimeFormat("es-MX", {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              }).format(new Date(config.rsvp.deadline + "T12:00:00Z"))}
              .
            </p>
            <Rsvp
              token={token}
              guests={guests}
              allowChanges={config.rsvp.allowChanges}
              preview={preview}
            />
          </>
        )}
        {key === "final" && <p>{dates}</p>}
        {key === "video" &&
          (() => {
            const v = config.design.video;
            const uploaded = asset(v.assetId);
            const embed = videoEmbed(v.url);
            return uploaded || (!embed && v.url) ? (
              <video
                className="invitation-video"
                controls
                playsInline
                preload="metadata"
                poster={asset(v.posterAssetId)?.url}
                src={uploaded?.url || v.url}
              />
            ) : embed ? (
              <iframe
                className="invitation-video"
                src={embed}
                title={v.caption || "Video de la invitación"}
                loading="lazy"
                allow="fullscreen; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : editing ? (
              <div className="canvas-placeholder">
                Elige un video o pega un enlace desde «Video».
              </div>
            ) : null;
          })()}
      </div>
    );
    if (key === "gallery" && !config.gallery.length && !editing) return null;
    if (
      key === "video" &&
      !config.design.video.assetId &&
      !config.design.video.url &&
      !editing
    )
      return null;
    return (
      <section
        key={key}
        id={key === "rsvp" ? "rsvp" : undefined}
        data-section={key}
        data-layout={s.layout}
        className={`designed-section ${key === "hero" ? "hero-design" : ""} ${editing?.section === key ? "section-selected" : ""} ${editing ? "is-editing" : ""}`}
        style={
          {
            "--section-pad": s.padding + "px",
            "--title-size": s.titleSize + "px",
            "--body-size": s.bodySize + "px",
            textAlign: s.align,
            ...(s.background ? { backgroundColor: s.background } : {}),
          } as CSSProperties
        }
        onClick={editing ? () => editing.select(key, keyTitle) : undefined}
      >
        {editing && (
          <span className="section-editor-label">{sectionLabels[key]}</span>
        )}
        {s.layout === "photo-background" && photo && (
          <>
            <img
              className="section-background-photo"
              src={photo.url}
              alt=""
              style={{ objectPosition: `${s.focalX}% ${s.focalY}%` }}
            />
            <div
              className="section-photo-overlay"
              style={{ backgroundColor: config.colors.bg, opacity: s.overlay }}
            />
          </>
        )}
        <div
          className={`section-arrangement ${photo ? "with-photo" : "without-photo"}`}
        >
          {s.layout === "photo-background" ? null : image}
          {body}
        </div>
        {config.design.layers
          .filter((l) => l.section === key)
          .map((l) => {
            const pos =
              editing?.viewport === "mobile"
                ? l.mobile || l.position
                : l.position;
            const node =
              l.kind === "text" ? (
                <span>{l.text}</span>
              ) : l.kind === "doodle" ? (
                <img
                  draggable={false}
                  src={doodleSvg(l.doodleId || "", l.color)}
                  alt={doodleNames[l.doodleId as DoodleId] || "Doodle"}
                />
              ) : asset(l.assetId) ? (
                <img
                  draggable={false}
                  src={asset(l.assetId)!.url}
                  alt={asset(l.assetId)!.alt}
                  className="masked-photo"
                  data-mask={l.mask}
                />
              ) : null;
            return (
              <Movable
                key={l.id}
                section={key}
                id={l.id}
                editing={editing}
                position={editing ? { x: pos.x, y: pos.y } : undefined}
                className={`design-layer layer-${l.kind}`}
                style={layerStyle(l)}
              >
                {node}
              </Movable>
            );
          })}
      </section>
    );
  }
  return (
    <main
      className={`invite visual-invitation bg-${config.background} ${preview ? "preview" : ""}`}
      style={vars}
    >
      <AssetFonts assets={assets} />
      <FontLibrary
        families={[
          ...Object.values(config.fonts),
          ...config.design.layers
            .filter((l) => l.kind === "text")
            .map((l) => l.font),
        ]}
      />
      {config.sections
        .filter((s) => s.enabled)
        .map((s) => renderSection(s.key))}
    </main>
  );
}
