"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function InstitutionHeader({ children, brandTitle = "College of Postgraduate Studies" }: { children?: React.ReactNode; brandTitle?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScroll = () => setScrolled(window.scrollY > 8);
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const firstLink = menuRef.current?.querySelector<HTMLElement>("a, button");
    firstLink?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  function closeMenu(event: React.MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("a, button")) setMenuOpen(false);
  }

  return <header className="site-header sticky top-0" data-scrolled={scrolled}>
    <div className="page-wrap header-inner flex min-h-[5.25rem] items-center justify-between gap-4 py-2.5">
      <Link href="/" className="brand-lockup" aria-label="Redeemers University College of Postgraduate Studies home">
        <Image src="/logo.png" alt="Redeemers University logo" width={68} height={68} className="brand-mark" priority />
        <span className="min-w-0"><span className="brand-eyebrow">Redeemers University</span><span className="brand-title">{brandTitle}</span></span>
      </Link>
      {children && <div className="header-desktop-actions flex shrink-0 items-center gap-2 sm:gap-3">{children}</div>}
      {children && <button
        ref={menuButtonRef}
        type="button"
        className="header-menu-toggle button-secondary"
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={menuOpen}
        aria-controls="institution-mobile-nav"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span aria-hidden="true" className="menu-icon"><span /><span /><span /></span>
      </button>}
    </div>
    {children && <div
      ref={menuRef}
      id="institution-mobile-nav"
      className="header-mobile-nav"
      data-open={menuOpen}
      onClick={closeMenu}
      role="group"
      aria-label="Mobile navigation actions"
      hidden={!menuOpen}
    >{children}</div>}
  </header>;
}

export function SiteFooter() {
  return <footer className="site-footer border-t border-slate-200/80 bg-white/60">
    <div className="page-wrap flex flex-col gap-2 py-7 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <p>(c) {new Date().getFullYear()} Redeemers University | College of Postgraduate Studies</p>
      <p>Postgraduate Career Tracking System</p>
    </div>
  </footer>;
}
