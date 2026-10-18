"use client";
import { useRef, type CSSProperties, type PointerEvent } from "react";
export type CanvasEditing = {
  section: string;
  item: string | null;
  viewport: "mobile" | "desktop";
  select: (section: string, item: string) => void;
  move: (section: string, item: string, x: number, y: number) => void;
};
export default function Movable({
  section,
  id,
  editing,
  position,
  children,
  className = "",
  style = {},
}: {
  section: string;
  id: string;
  editing?: CanvasEditing;
  position?: { x: number; y: number };
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const drag = useRef<{
    x: number;
    y: number;
    px: number;
    py: number;
    width: number;
    moved: boolean;
  } | null>(null);
  const selected = editing?.section === section && editing.item === id;
  function start(e: PointerEvent<HTMLDivElement>) {
    if (!editing || e.button !== 0) return;
    e.stopPropagation();
    editing.select(section, id);
    const bounds = e.currentTarget
      .closest("[data-section]")!
      .getBoundingClientRect();
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      px: position?.x || 0,
      py: position?.y || 0,
      width: bounds.width,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || !editing) return;
    const dx = ((e.clientX - d.x) / d.width) * 100;
    const dy = ((e.clientY - d.y) / d.width) * 100;
    if (Math.abs(dx) + Math.abs(dy) < 0.4 && !d.moved) return;
    d.moved = true;
    editing.move(section, id, d.px + dx, d.py + dy);
  }
  return (
    <div
      className={`${className} ${editing ? "editable-item" : ""} ${selected ? "item-selected" : ""}`}
      data-item={id}
      style={{
        ...style,
        ...(position
          ? ({
              "--shift-x": position.x,
              "--shift-y": position.y,
            } as CSSProperties)
          : {}),
      }}
      onPointerDown={editing ? start : undefined}
      onPointerMove={editing ? move : undefined}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      tabIndex={editing ? 0 : undefined}
      role={editing ? "button" : undefined}
      aria-label={
        editing
          ? `Editar ${id === "title" ? "título" : id === "body" ? "texto" : id === "photo" ? "foto" : id === "names" ? "nombres" : "elemento"}`
          : undefined
      }
      onKeyDown={(e) => {
        if (!editing || e.target !== e.currentTarget) return;
        if (e.key === "Enter") {
          editing.select(section, id);
          return;
        }
        if (
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
        ) {
          e.preventDefault();
          e.stopPropagation();
          editing.move(
            section,
            id,
            (position?.x || 0) +
              (e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0),
            (position?.y || 0) +
              (e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0),
          );
        }
      }}
      onClick={
        editing
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              editing.select(section, id);
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
