import type { Metadata } from "next";

export const metadata: Metadata = { title: "Student login" };

export default function LoginLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
