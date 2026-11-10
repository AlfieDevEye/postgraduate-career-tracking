import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sourceSans = Source_Sans_3({ subsets: ["latin"], display: "swap", variable: "--font-sans" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], display: "swap", variable: "--font-heading" });

export const metadata: Metadata = {
  title: "Redeemers University Postgraduate Career Tracking System",
  description: "Career profiles and employment updates for Redeemers University postgraduate students and graduates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sourceSans.variable} ${sourceSerif.variable}`}>
      <head><meta charSet="utf-8" /></head>
      <body><a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-slate-900" href="#main-content">Skip to content</a>{children}</body>
    </html>
  );
}
