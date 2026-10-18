"use client";
import { useState } from "react";
import fonts from "@/lib/font-catalog.json";
import FontLibrary from "../FontLibrary";
import type { Asset } from "@/lib/types";
export default function FontPicker({
  value,
  onChange,
  assets,
}: {
  value: string;
  onChange: (v: string) => void;
  assets: Asset[];
}) {
  const [category, setCategory] = useState("Caligrafía");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const categories = [...new Set(fonts.map((f) => f.category))];
  const visible = fonts.filter(
    (f) =>
      f.category === category &&
      f.name.toLowerCase().includes(query.toLowerCase()),
  );
  const name =
    fonts.find((f) => f.family === value)?.name ||
    assets.find((a) => a.family === value)?.name ||
    value;
  return (
    <div className="font-picker">
      <button
        className="secondary font-picker-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        Aa · {name} <span>⌄</span>
      </button>
      {open && (
        <div className="font-popover">
          <input
            placeholder="Buscar letra…"
            aria-label="Buscar tipografía"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            aria-label="Categoría de tipografías"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
            <option>Mis fuentes</option>
          </select>
          <FontLibrary families={visible.map((f) => f.family)} />
          <div className="font-options">
            {category === "Mis fuentes"
              ? assets
                  .filter((a) => a.kind === "font")
                  .map((a) => (
                    <button
                      className="font-option"
                      key={a.id}
                      style={{ fontFamily: a.family! }}
                      onClick={() => {
                        onChange(a.family!);
                        setOpen(false);
                      }}
                    >
                      {a.name}
                    </button>
                  ))
              : visible.map((f) => (
                  <button
                    className={`font-option ${value === f.family ? "chosen" : ""}`}
                    key={f.id}
                    onClick={() => {
                      onChange(f.family);
                      setOpen(false);
                    }}
                  >
                    <small>{f.name}</small>
                    <span style={{ fontFamily: f.family }}>
                      Celebra la vida · Ale & Juan
                    </span>
                  </button>
                ))}
          </div>
          <small>
            12 opciones por categoría, listas para una invitación web.
          </small>
        </div>
      )}
    </div>
  );
}
