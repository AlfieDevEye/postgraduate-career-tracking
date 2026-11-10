import type { Metadata } from "next";
import { StudentPortalShell } from "@/components/student-portal-shell";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default function StudentDashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <StudentPortalShell>{children}</StudentPortalShell>;
}
