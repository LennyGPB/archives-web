"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/components/I18nProvider";
import RichText from "@/components/RichText";

type Props = {
  credits: number | null;
  onClose: () => void;
};

/** Confirmation shown once, right after Stripe redirects back with `?purchase=success`. */
export default function PurchaseSuccessModal({ credits, onClose }: Props) {
  const { dict } = useI18n();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const open = credits !== null;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-backdrop fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#030504]/75 p-4 backdrop-blur-md sm:p-8"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      role="presentation"
    >
      <section
        aria-labelledby="purchase-success-title"
        aria-modal="true"
        className="modal-panel relative w-full max-w-md overflow-hidden border border-white/15 bg-[rgba(15,20,17,.72)] px-6 py-7 shadow-[0_28px_90px_rgba(0,0,0,.58)] backdrop-blur-2xl sm:px-10 sm:py-10"
        role="dialog"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,.08),transparent_38%,rgba(134,169,141,.08))]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#b8d2bd] to-transparent" aria-hidden="true" />
        <button
          aria-label={dict.modal.closeAria}
          className="absolute top-4 right-4 z-10 grid size-10 cursor-pointer place-items-center border border-white/10 bg-white/[.04] text-white/65 transition-colors hover:border-white/25 hover:bg-white/[.08] hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#86a98d]"
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          <svg aria-hidden="true" className="size-4 fill-none stroke-current stroke-[1.5]" viewBox="0 0 20 20"><path d="m4 4 12 12M16 4 4 16" /></svg>
        </button>

        <div className="relative">
          <div className="mb-7 flex size-14 items-center justify-center border border-[#86a98d]/40 bg-[#86a98d]/10 text-[#b8d2bd] shadow-[0_12px_34px_rgba(4,8,5,.4)]" aria-hidden="true">
            <svg className="size-7 fill-none stroke-current stroke-[1.35]" viewBox="0 0 28 28"><path className="[stroke-linecap:round] [stroke-linejoin:round]" d="m6.5 14.5 4.5 4.5L21.5 8.5" /></svg>
          </div>
          <h2
            className="modal-title m-0 max-w-md font-[family-name:var(--font-alumni-sans)] text-4xl leading-[.95] font-semibold tracking-wide text-[#f4f3ef] sm:text-5xl"
            data-text={dict.packs.purchaseSuccessTitle}
            id="purchase-success-title"
          >
            {dict.packs.purchaseSuccessTitle}
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 font-light text-[#c4c5c0]">
            <RichText>{dict.packs.purchaseSuccessBody.replace("{count}", String(credits))}</RichText>
          </p>
          <button
            className="mt-8 min-h-12 w-full cursor-pointer border border-[#86a98d]/55 bg-[#86a98d]/10 px-5 font-[family-name:var(--font-geist-mono)] text-xs tracking-widest text-[#dce9df] transition-[background-color,border-color] hover:border-[#b8d2bd] hover:bg-[#86a98d]/20 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#86a98d] sm:w-auto"
            onClick={onClose}
            type="button"
          >
            {dict.modal.continue}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
