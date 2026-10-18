"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="empty-page">
      <h1>No pudimos cargar esta página</h1>
      <p>Revisa tu conexión e inténtalo otra vez.</p>
      <button onClick={reset}>Volver a intentar</button>
    </main>
  );
}
