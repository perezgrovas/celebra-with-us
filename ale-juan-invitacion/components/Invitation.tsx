"use client";
import type { CSSProperties } from "react";
import Countdown from "./Countdown";
import Rsvp from "./Rsvp";
import AssetFonts from "./AssetFonts";
import {
  eventInstant,
  formatDate,
  type WeddingConfig,
  type SectionKey,
} from "@/lib/config";
import type { Asset, PublicGuest } from "@/lib/types";
export default function Invitation({
  config,
  assets = [],
  guests = [],
  token,
  groupName,
  preview = false,
}: {
  config: WeddingConfig;
  assets?: Asset[];
  guests?: PublicGuest[];
  token?: string;
  groupName?: string;
  preview?: boolean;
}) {
  const asset = (id: string | null) => assets.find((a) => a.id === id);
  const background = asset(config.backgroundAssetId);
  const hero = asset(config.heroAssetId);
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
  const sections: Record<SectionKey, React.ReactNode> = {
    hero: (
      <section className="hero">
        {hero && <img className="hero-photo" src={hero.url} alt={hero.alt} />}
        <div className="hero-content">
          <div className="eyebrow">NOS CASAMOS</div>
          <h1>
            {config.couple.bride}
            <span>&</span>
            {config.couple.groom}
          </h1>
          <p className="date-line">{formatDate(config)}</p>
          <p>
            {config.couple.venue}
            <br />
            {config.couple.city}
          </p>
          {groupName && (
            <p className="personal-note">Con mucho cariño para {groupName}</p>
          )}
          {config.sections.some((s) => s.key === "rsvp" && s.enabled) && (
            <a className="text-link" href="#rsvp">
              Confirma tu asistencia ↓
            </a>
          )}
        </div>
      </section>
    ),
    countdown: (
      <section className="section">
        <p className="kicker">Cada vez falta menos</p>
        <h2>Nos vemos en…</h2>
        <Countdown instant={eventInstant(config)} />
      </section>
    ),
    story: (
      <section className="section split">
        <div>
          <p className="kicker">Nuestra historia</p>
          <h2>{config.content.storyTitle}</h2>
        </div>
        <p>{config.content.story}</p>
      </section>
    ),
    gallery:
      config.gallery.length > 0 ? (
        <section className="section">
          <p className="kicker">Un poquito de nosotros</p>
          <div className="gallery">
            {config.gallery.map((id) => {
              const a = asset(id);
              return a ? (
                <img key={id} src={a.url} alt={a.alt} loading="lazy" />
              ) : null;
            })}
          </div>
        </section>
      ) : null,
    schedule: (
      <section className="section">
        <p className="kicker">El gran día</p>
        <h2>Itinerario</h2>
        <div className="timeline">
          {config.schedule.map((s, i) => (
            <div key={i}>
              <time>{s.time}</time>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>
    ),
    location: (
      <section className="section card-section">
        <p className="kicker">Ubicación</p>
        <h2>{config.couple.venue}</h2>
        <p>{config.couple.city}</p>
        {config.content.mapUrl && (
          <a
            className="invite-button"
            href={config.content.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Cómo llegar ↗
          </a>
        )}
      </section>
    ),
    dresscode: (
      <section className="section split">
        <div>
          <p className="kicker">Vestimenta</p>
          <h2>Formal cómodo</h2>
        </div>
        <p>{config.content.dresscode}</p>
      </section>
    ),
    lodging: (
      <section className="section card-section">
        <p className="kicker">Hospedaje</p>
        <h2>Quédate cerca</h2>
        <p>{config.content.lodging}</p>
      </section>
    ),
    gifts: (
      <section className="section">
        <p className="kicker">Regalos</p>
        <h2>Tu presencia es el mejor regalo</h2>
        <p>{config.content.gifts}</p>
        {config.content.giftsUrl && (
          <a
            className="invite-button"
            href={config.content.giftsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver opciones ↗
          </a>
        )}
      </section>
    ),
    rsvp: (
      <section className="section" id="rsvp">
        <p className="kicker">Confirmación</p>
        <h2>¿Nos acompañas?</h2>
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
      </section>
    ),
    final: (
      <section className="section final">
        <p>{config.content.final}</p>
        <h2>
          {config.couple.bride} & {config.couple.groom}
        </h2>
        <span>{formatDate(config)}</span>
      </section>
    ),
  };
  return (
    <main
      className={`invite bg-${config.background} ${preview ? "preview" : ""}`}
      style={vars}
    >
      <AssetFonts assets={assets} />
      {config.sections
        .filter((s) => s.enabled)
        .map((s) => (
          <div key={s.key} data-section={s.key}>
            {sections[s.key]}
          </div>
        ))}
    </main>
  );
}
