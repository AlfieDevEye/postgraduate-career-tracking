import type { Metadata } from "next";

export const metadata: Metadata = { title: "Verify your email", robots: { index: false } };

export default function VerifyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
