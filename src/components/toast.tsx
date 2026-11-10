"use client";
import { useEffect, useRef, useState } from "react";
export function Toast({ message, onClose, duration = 3000 }: { message: string; onClose: () => void; duration?: number }) {
  const [paused, setPaused] = useState(false);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  useEffect(() => {
    if (!message || paused) return;
    const timer = setTimeout(() => closeRef.current(), duration);
    return () => clearTimeout(timer);
  }, [message, paused, duration]);
  if (!message) return null;
  return <div role="status" aria-live="polite" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} className="fixed right-4 top-24 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg">
    <span>{message}</span>
    <button type="button" onClick={onClose} className="-mr-1 rounded px-1 text-emerald-700" aria-label="Dismiss message"><span aria-hidden="true">&times;</span></button>
  </div>;
}
