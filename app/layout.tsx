import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PuraVenta",
  description: "Compra y vende en Costa Rica",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    "pk_test_c3RlcmxpbmctcmVkYmlyZC01Ny5jbGVyay5hY2NvdW50cy5kZXYk";

  console.log("CLERK KEY:", publishableKey);

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="es">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}