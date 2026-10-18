"use client";
import { useRef } from "react";
import type { Asset } from "@/lib/types";
export default function PhotoGallery({
  photos,
  mode,
  fit,
  height,
  mask = "none",
  focalX = 50,
  focalY = 50,
}: {
  photos: Asset[];
  mode: "carousel" | "grid" | "mosaic";
  fit: "cover" | "contain";
  height: number;
  mask?: string;
  focalX?: number;
  focalY?: number;
}) {
  const track = useRef<HTMLDivElement>(null);
  if (!photos.length) return null;
  return (
    <div
      className={`photo-gallery mode-${mode} ${photos.length === 1 ? "single-photo" : ""}`}
    >
      <div ref={track} className="photo-track">
        {photos.map((p, i) => (
          <figure key={p.id} className="photo-slide">
            <div className="masked-photo" data-mask={mask} style={{ height }}>
              <img
                src={p.url}
                alt={p.alt || `Foto ${i + 1}`}
                loading="lazy"
                style={{
                  objectFit: fit,
                  objectPosition: `${focalX}% ${focalY}%`,
                }}
              />
            </div>
          </figure>
        ))}
      </div>
      {mode === "carousel" && photos.length > 1 && (
        <div className="carousel-controls">
          <button
            type="button"
            aria-label="Fotos anteriores"
            onClick={() =>
              track.current?.scrollBy({
                left: -(track.current.clientWidth || 0) * 0.85,
                behavior: "smooth",
              })
            }
          >
            ←
          </button>
          <span>{photos.length} recuerdos · desliza para verlos</span>
          <button
            type="button"
            aria-label="Fotos siguientes"
            onClick={() =>
              track.current?.scrollBy({
                left: (track.current.clientWidth || 0) * 0.85,
                behavior: "smooth",
              })
            }
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
