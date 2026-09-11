"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useI18n } from "@/components/I18nProvider";

/** Pseudo pill in the header — click opens a small dropdown with just "Log out" (and "Admin" for admins). */
export default function UserMenu() {
  const { dict, lang } = useI18n();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!user) return null;

  return (
    <div className="relative min-w-0" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="group inline-flex h-10 min-w-0 cursor-pointer items-center gap-2 border border-[#86a98d]/55 bg-[#86a98d]/12 px-3 font-[family-name:var(--font-geist-mono)] text-[9px] font-semibold tracking-wider text-[#dce9df] shadow-[0_10px_28px_rgba(0,0,0,.25)] transition-[border-color,background-color] hover:border-[#b8d2bd] hover:bg-[#86a98d]/22 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#86a98d] sm:h-11 sm:gap-3 sm:px-5 sm:text-[10px] sm:tracking-widest"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="max-w-[84px] truncate sm:max-w-[160px]">{user.pseudo}</span>
        <span className="hidden shrink-0 border-l border-[#86a98d]/30 pl-3 text-[#86a98d] sm:inline">
          {dict.auth.transmissionCreditsLabel.replace("{count}", String(user.transmissionCredits))}
        </span>
        <svg aria-hidden="true" className={`size-3.5 shrink-0 fill-none stroke-current stroke-[1.5] transition-transform duration-200 ${open ? "rotate-180" : ""}`} viewBox="0 0 12 12">
          <path className="[stroke-linecap:round] [stroke-linejoin:round]" d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 z-30 mt-2 min-w-full overflow-hidden border border-white/15 bg-[rgba(15,20,17,.92)] shadow-[0_18px_50px_rgba(0,0,0,.5)] backdrop-blur-xl" role="menu">
          {user.role === "ADMIN" && (
            <a
              className="block w-full border-0 border-b border-white/10 bg-transparent px-4 py-2.5 text-left font-[family-name:var(--font-geist-mono)] text-[10px] tracking-widest whitespace-nowrap text-[#86a98d] no-underline hover:bg-white/[.06] focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-2 focus-visible:outline-[#86a98d]"
              href={`/${lang}/admin`}
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              Admin
            </a>
          )}
          <button
            className="block w-full cursor-pointer border-0 bg-transparent px-4 py-2.5 text-left font-[family-name:var(--font-geist-mono)] text-[10px] tracking-widest whitespace-nowrap text-white/60 hover:bg-white/[.06] hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-2 focus-visible:outline-[#86a98d]"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            role="menuitem"
            type="button"
          >
            {dict.auth.logout}
          </button>
        </div>
      )}
    </div>
  );
}
