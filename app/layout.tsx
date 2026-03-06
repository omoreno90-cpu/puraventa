import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    "pk_test_c3RlcmxpbmctcmVkYmlyZC01Ny5jbGVyay5hY2NvdW50cy5kZXYk";

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="es">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}