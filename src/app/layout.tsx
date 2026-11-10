import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sourceSans = Source_Sans_3({ subsets: ["latin"], display: "swap", variable: "--font-sans" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], display: "swap", variable: "--font-heading" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://alumni-track-tau.vercel.app"),
  title: {
    default: "Redeemers University Postgraduate Career Tracking System",
    template: "%s | Postgraduate Career Tracking",
  },
  description: "Career profiles and employment updates for Redeemers University postgraduate students and graduates.",
  openGraph: {
    siteName: "Redeemers University Postgraduate Career Tracking System",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sourceSans.variable} ${sourceSerif.variable}`} suppressHydrationWarning>
      <head><meta charSet="utf-8" /><script dangerouslySetInnerHTML={{ __html: 'try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}' }} /></head>
      <body><a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-3 focus:font-semibold focus:text-slate-900" href="#main-content">Skip to content</a>{children}</body>
    </html>
  );
}
