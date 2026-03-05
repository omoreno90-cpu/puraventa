import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "PuraVenta",
  description: "Compra y vende en Costa Rica",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error("Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="es">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}