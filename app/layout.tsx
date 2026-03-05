import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <ClerkProvider publishableKey={clerkKey}>
      <html lang="es">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}