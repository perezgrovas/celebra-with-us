"use client";
import { useState } from "react";
import { createTable, deleteTable, updateGuest } from "@/lib/services/weddings";
import type { Guest, WeddingTable } from "@/lib/types";
import { Field } from "./ConfigEditor";
export default function TablesPanel({
  wid,
  tables,
  guests,
  refresh,
  report,
}: {
  wid: string;
  tables: WeddingTable[];
  guests: Guest[];
  refresh: () => Promise<void>;
  report: (m: string) => void;
}) {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(10);
  const [busy, setBusy] = useState(false);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
      await refresh();
      report("Distribución de mesas actualizada.");
    } catch (e) {
      report(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <p className="hint">
        Asigna a quienes ya confirmaron. No se puede exceder la capacidad de una
        mesa.
      </p>
      <form
        className="inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            await createTable(wid, name, capacity);
            setName("");
          });
        }}
      >
        <Field label="Nombre de la mesa">
          <input
            required
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mesa 1"
          />
        </Field>
        <Field label="Capacidad">
          <input
            required
            type="number"
            min={1}
            max={50}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />
        </Field>
        <button disabled={busy}>+ Crear mesa</button>
      </form>
      <div className="table-grid">
        {tables.map((t) => {
          const assigned = guests.filter((g) => g.table_id === t.id);
          return (
            <article className="table-card" key={t.id}>
              <div className="table-icon">
                {assigned.length}
                <small>/{t.capacity}</small>
              </div>
              <h2>{t.name}</h2>
              {assigned.map((g) => (
                <p key={g.id}>
                  {g.companion_name || g.name}
                  <button
                    className="icon-button"
                    aria-label={`Quitar ${g.name} de ${t.name}`}
                    disabled={busy}
                    onClick={() =>
                      void run(() => updateGuest(g.id, { table_id: null }))
                    }
                  >
                    ×
                  </button>
                </p>
              ))}
              <button
                className="text-danger"
                disabled={busy || assigned.length > 0}
                onClick={() => void run(() => deleteTable(t.id))}
              >
                Eliminar mesa vacía
              </button>
            </article>
          );
        })}
      </div>
      <h2>Invitados confirmados</h2>
      {guests
        .filter((g) => g.status === "attending")
        .map((g) => (
          <div className="assignment-row" key={g.id}>
            <span>{g.companion_name || g.name}</span>
            <select
              aria-label={`Mesa de ${g.name}`}
              value={g.table_id || ""}
              disabled={busy}
              onChange={(e) =>
                void run(() =>
                  updateGuest(g.id, { table_id: e.target.value || null }),
                )
              }
            >
              <option value="">Sin mesa</option>
              {tables.map((t) => (
                <option
                  key={t.id}
                  value={t.id}
                  disabled={
                    g.table_id !== t.id &&
                    guests.filter((x) => x.table_id === t.id).length >=
                      t.capacity
                  }
                >
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      {!guests.some((g) => g.status === "attending") && (
        <div className="empty-card">
          Cuando tus invitados confirmen, podrás asignarles mesa aquí.
        </div>
      )}
    </>
  );
}
