import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PuraVenta",
  description: "Compra y vende en Costa Rica. PuraVenta no gestiona pagos: solo conecta personas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
