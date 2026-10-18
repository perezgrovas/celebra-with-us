"use client";
import { useState } from "react";
import type { Group, Guest } from "@/lib/types";
import { createGroup, deleteGroup, updateGuest } from "@/lib/services/weddings";
import { Field } from "./ConfigEditor";
export default function GuestsPanel({
  wid,
  groups,
  guests,
  refresh,
  report,
}: {
  wid: string;
  groups: Group[];
  guests: Guest[];
  refresh: () => Promise<void>;
  report: (m: string) => void;
}) {
  const [name, setName] = useState("");
  const [seats, setSeats] = useState(2);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  async function run(action: () => Promise<void>, message: string) {
    setBusy(true);
    try {
      await action();
      await refresh();
      report(message);
    } catch (e) {
      report(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }
  async function add(e: React.FormEvent) {
    e.preventDefault();
    await run(async () => {
      await createGroup(wid, name, seats);
      setName("");
    }, "Invitación creada. Personaliza los nombres y comparte el enlace.");
  }
  const visible = groups.filter(
    (g) =>
      g.display_name.toLocaleLowerCase().includes(query.toLocaleLowerCase()) &&
      (filter === "all" ||
        guests.some((x) => x.group_id === g.id && x.status === filter)),
  );
  function exportCsv() {
    const rows = [
      ["Invitación", "Nombre", "Asistencia", "Alergias", "Acompañante"],
      ...guests.map((g) => [
        groups.find((x) => x.id === g.group_id)?.display_name || "",
        g.name,
        g.status,
        g.dietary,
        g.companion_name,
      ]),
    ];
    const safe = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);
    const csv =
      "\ufeff" +
      rows
        .map((r) =>
          r.map((v) => '"' + safe(v).replaceAll('"', '""') + '"').join(","),
        )
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "invitados.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <p className="hint">
        Una invitación puede incluir a una persona, pareja o familia. Cada pase
        tiene su propia respuesta.
      </p>
      <form className="inline-form" onSubmit={add}>
        <Field label="Nombre de la invitación">
          <input
            required
            maxLength={120}
            placeholder="Dany y su acompañante"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Pases">
          <input
            type="number"
            min={1}
            max={20}
            required
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
          />
        </Field>
        <button disabled={busy}>+ Crear invitación</button>
      </form>
      <div className="filter-bar">
        <input
          aria-label="Buscar invitación"
          placeholder="Buscar por invitación…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Filtrar asistencia"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Todas las respuestas</option>
          <option value="pending">Pendientes</option>
          <option value="attending">Confirmados</option>
          <option value="declined">No asisten</option>
        </select>
        <button className="secondary" onClick={exportCsv}>
          Exportar CSV
        </button>
      </div>
      {visible.map((group) => (
        <article className="group-card" key={group.id}>
          <div className="group-header">
            <div>
              <h2>{group.display_name}</h2>
              <small>
                {group.seats} {group.seats === 1 ? "pase" : "pases"}
              </small>
            </div>
            <button
              className="secondary"
              disabled={busy}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `${window.location.origin}/i/${group.token}`,
                  );
                  report(
                    "Enlace copiado. Compártelo solo con esta invitación.",
                  );
                } catch {
                  report("No se pudo copiar. Selecciona el enlace de abajo.");
                }
              }}
            >
              Copiar enlace
            </button>
          </div>
          <a
            className="invite-link"
            href={`/i/${group.token}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir invitación personal ↗
          </a>
          {guests
            .filter((g) => g.group_id === group.id)
            .map((g) => (
              <div className="guest-row" key={g.id}>
                <Field label="Nombre del invitado">
                  <input
                    key={g.name}
                    defaultValue={g.name}
                    disabled={busy}
                    maxLength={120}
                    onBlur={(e) => {
                      const n = e.target.value.trim();
                      if (n && n !== g.name)
                        void run(
                          () => updateGuest(g.id, { name: n }),
                          "Nombre actualizado.",
                        );
                    }}
                  />
                </Field>
                <span className={`badge ${g.status}`}>
                  {
                    {
                      pending: "Pendiente",
                      attending: "Confirmado",
                      declined: "No asiste",
                    }[g.status]
                  }
                </span>
                {g.companion_name && (
                  <small>Acompañante: {g.companion_name}</small>
                )}
                {g.dietary && <small>Alergias: {g.dietary}</small>}
              </div>
            ))}
          {deleting === group.id ? (
            <div className="delete-confirm">
              <span>Se eliminarán sus pases y respuestas.</span>
              <button
                disabled={busy}
                className="danger"
                onClick={() =>
                  void run(() => deleteGroup(group.id), "Invitación eliminada.")
                }
              >
                Eliminar definitivamente
              </button>
              <button className="secondary" onClick={() => setDeleting(null)}>
                Cancelar
              </button>
            </div>
          ) : (
            <button
              className="text-danger"
              onClick={() => setDeleting(group.id)}
            >
              Eliminar invitación
            </button>
          )}
        </article>
      ))}
      {visible.length === 0 && (
        <div className="empty-card">No hay invitaciones en esta vista.</div>
      )}
    </>
  );
}
