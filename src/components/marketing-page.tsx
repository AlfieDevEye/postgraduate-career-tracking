import { InstitutionHeader, SiteFooter } from "@/components/institution-header";
import { SiteNav } from "@/components/site-nav";
export function MarketingPage({ children }: { children: React.ReactNode }) {
  return <main id="main-content" className="overflow-x-clip text-slate-900">
    <InstitutionHeader><SiteNav /></InstitutionHeader>
    {children}
    <SiteFooter />
  </main>;
}
