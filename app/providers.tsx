"use client";

import { ClerkProvider } from "@clerk/nextjs";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
        "pk_test_c3RlcmxpbmctcmVkYmlyZC01Ny5jbGVyay5hY2NvdW50cy5kZXYk"
      }
    >
      {children}
    </ClerkProvider>
  );
}