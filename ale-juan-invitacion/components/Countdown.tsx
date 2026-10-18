"use client";
import { useEffect, useState } from "react";
export default function Countdown({ instant }: { instant: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const delta =
    now === null ? null : Math.max(0, new Date(instant).getTime() - now);
  if (delta === 0) return <p className="today-message">¡Llegó el gran día!</p>;
  const values =
    delta === null
      ? ["—", "—", "—", "—"]
      : [
          Math.floor(delta / 86400000),
          Math.floor(delta / 3600000) % 24,
          Math.floor(delta / 60000) % 60,
          Math.floor(delta / 1000) % 60,
        ];
  return (
    <div className="count-grid" aria-label="Tiempo para la boda">
      {values.map((value, i) => (
        <div className="count-item" key={i}>
          <strong>{String(value).padStart(2, "0")}</strong>
          <span>{["DÍAS", "HORAS", "MIN", "SEG"][i]}</span>
        </div>
      ))}
    </div>
  );
}
