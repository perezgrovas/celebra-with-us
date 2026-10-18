import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ale & Juan · 06.03.2027",
  description: "Invitación de boda de Ale y Juan",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
