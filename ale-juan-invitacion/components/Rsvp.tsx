"use client";
import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import type { PublicGuest } from "@/lib/types";
export default function Rsvp({
  token,
  guests,
  allowChanges,
  preview,
}: {
  token?: string;
  guests: PublicGuest[];
  allowChanges: boolean;
  preview: boolean;
}) {
  const [answers, setAnswers] = useState(guests);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  if (preview)
    return (
      <div className="rsvp-placeholder">
        Cada invitado verá aquí sus pases y podrá confirmar desde su enlace
        personal.
      </div>
    );
  if (!token)
    return (
      <p>
        Confirma desde el enlace personalizado que te compartimos. Si no lo
        tienes, escríbenos.
      </p>
    );
  const locked = !allowChanges && guests.some((g) => g.status !== "pending");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setSuccess(false);
    setBusy(true);
    try {
      const { error } = await getBrowserClient().rpc("submit_rsvp", {
        invite_token: token,
        answers: answers.map((g) => ({
          id: g.id,
          status: g.status,
          dietary: g.dietary,
          companion_name: g.companion_name,
        })),
      });
      if (error) throw error;
      setSuccess(true);
      setMessage("¡Gracias! Tu respuesta quedó guardada.");
      if (!allowChanges) window.location.reload();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : typeof error === "object" && error && "message" in error
            ? String(error.message)
            : "No pudimos guardar tu respuesta. Inténtalo de nuevo.",
      );
    } finally {
      setBusy(false);
    }
  }
  function patch(id: string, p: Partial<PublicGuest>) {
    setAnswers((a) => a.map((g) => (g.id === id ? { ...g, ...p } : g)));
  }
  return (
    <form onSubmit={submit} className="rsvp-form">
      {answers.map((g) => (
        <fieldset key={g.id} disabled={busy || locked}>
          <legend>{g.name}</legend>
          {g.name.startsWith("Acompañante") && (
            <label>
              Nombre de tu acompañante
              <input
                maxLength={120}
                value={g.companion_name}
                onChange={(e) =>
                  patch(g.id, { companion_name: e.target.value })
                }
              />
            </label>
          )}
          <label>
            ¿Nos acompañas?
            <select
              required
              value={g.status === "pending" ? "" : g.status}
              onChange={(e) =>
                patch(g.id, { status: e.target.value as PublicGuest["status"] })
              }
            >
              <option value="" disabled>
                Selecciona una opción
              </option>
              <option value="attending">¡Sí, ahí estaré!</option>
              <option value="declined">No podré asistir</option>
            </select>
          </label>
          {g.status === "attending" && (
            <label>
              Alergias o restricciones alimentarias (opcional)
              <textarea
                maxLength={1000}
                value={g.dietary}
                onChange={(e) => patch(g.id, { dietary: e.target.value })}
              />
            </label>
          )}
          {g.table_name && g.status === "attending" && (
            <p>Tu mesa: {g.table_name}</p>
          )}
        </fieldset>
      ))}
      {locked ? (
        <p>
          Tu respuesta ya está registrada. Para hacer un cambio, escríbenos.
        </p>
      ) : (
        <button disabled={busy}>
          {busy ? "Guardando…" : "Guardar confirmación"}
        </button>
      )}
      <p role="status" className={success ? "success" : "error"}>
        {message}
      </p>
    </form>
  );
}
