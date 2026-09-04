"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Script from "next/script";
import { useI18n } from "@/components/I18nProvider";
import RichText from "@/components/RichText";
import {
  AuthTokens,
  authErrorCode,
  loginWithCredentials,
  loginWithGoogle,
  registerWithCredentials,
} from "@/lib/auth-client";

type Mode = "login" | "register";
type View = "form" | "registerSuccess";

type Props = {
  open: boolean;
  onClose: () => void;
  onAuthenticated: (tokens: AuthTokens) => void;
};

// Minimal shape of the Google Identity Services client we actually use.
type GoogleIdentityServices = {
  accounts: {
    id: {
      initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, string>) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function AuthModal({ open, onClose, onAuthenticated }: Props) {
  const { dict, lang } = useI18n();
  const [mode, setMode] = useState<Mode>("register");
  const [view, setView] = useState<View>("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [googleReady, setGoogleReady] = useState(false);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const title = mode === "login" ? dict.auth.titleLogin : dict.auth.titleRegister;

  // Also clears transient UI state, so a stale error (or the previous success screen)
  // doesn't flash the next time the modal opens.
  function handleClose() {
    setFeedback("");
    setIsSubmitting(false);
    setMode("register");
    setView("form");
    onClose();
  }

  function switchMode(next: Mode) {
    setFeedback("");
    setMode(next);
  }

  // Scroll lock, focus trap and Escape-to-close — same contract as the waitlist confirmation modal.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
      if (event.key !== "Tab") return;
      const controls = panelRef.current?.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleGoogleCredential(response: { credential: string }) {
    setFeedback("");
    setIsSubmitting(true);
    try {
      const tokens = await loginWithGoogle(response.credential);
      onAuthenticated(tokens);
      handleClose();
    } catch (error) {
      setFeedback(dict.auth.errors[authErrorCode(error)]);
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!open || !googleReady || !googleClientId || !googleButtonRef.current) return;
    if (!window.google) return;

    window.google.accounts.id.initialize({ client_id: googleClientId, callback: handleGoogleCredential });
    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      type: "standard",
      theme: "filled_black",
      size: "large",
      shape: "rectangular",
      width: "336",
      locale: lang,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, googleReady, mode, lang]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const pseudo = String(form.get("pseudo") ?? "");

    try {
      const tokens =
        mode === "login" ? await loginWithCredentials(email, password) : await registerWithCredentials(email, password, pseudo);
      onAuthenticated(tokens);
      if (mode === "register") {
        // Stay open on a success screen — registering also joins the waitlist, worth confirming.
        setIsSubmitting(false);
        setView("registerSuccess");
      } else {
        handleClose();
      }
    } catch (error) {
      setFeedback(dict.auth.errors[authErrorCode(error)]);
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return createPortal(
    <div
      className="modal-backdrop fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#030504]/75 p-4 backdrop-blur-md sm:p-8"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && handleClose()}
    >
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setGoogleReady(true)} />
      <section
        aria-labelledby="auth-modal-title"
        aria-modal="true"
        className="modal-panel relative w-full max-w-md overflow-hidden border border-white/15 bg-[rgba(15,20,17,.72)] px-6 py-7 shadow-[0_28px_90px_rgba(0,0,0,.58)] backdrop-blur-2xl sm:px-10 sm:py-10"
        ref={panelRef}
        role="dialog"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,.08),transparent_38%,rgba(134,169,141,.08))]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#b8d2bd] to-transparent" aria-hidden="true" />
        <button
          aria-label={dict.auth.closeAria}
          className="absolute top-4 right-4 z-10 grid size-10 cursor-pointer place-items-center border border-white/10 bg-white/[.04] text-white/65 transition-colors hover:border-white/25 hover:bg-white/[.08] hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#86a98d]"
          onClick={handleClose}
          ref={closeButtonRef}
          type="button"
        >
          <svg aria-hidden="true" className="size-4 fill-none stroke-current stroke-[1.5]" viewBox="0 0 20 20"><path d="m4 4 12 12M16 4 4 16" /></svg>
        </button>

        {view === "registerSuccess" ? (
          <div className="relative">
            <div className="mb-7 flex size-14 items-center justify-center border border-[#86a98d]/40 bg-[#86a98d]/10 text-[#b8d2bd] shadow-[0_12px_34px_rgba(4,8,5,.4)]" aria-hidden="true">
              <svg className="size-7 fill-none stroke-current stroke-[1.35]" viewBox="0 0 28 28"><path className="[stroke-linecap:round] [stroke-linejoin:round]" d="m6.5 14.5 4.5 4.5L21.5 8.5" /></svg>
            </div>
            <h2 className="modal-title m-0 max-w-md font-[family-name:var(--font-alumni-sans)] text-4xl leading-[.95] font-semibold tracking-wide text-[#f4f3ef] sm:text-5xl" data-text={dict.auth.registerSuccessTitle} id="auth-modal-title">
              {dict.auth.registerSuccessTitle}
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 font-light text-[#c4c5c0]">
              <RichText>{dict.auth.registerSuccessBody}</RichText>
            </p>
            <button className="mt-8 min-h-12 w-full cursor-pointer border border-[#86a98d]/55 bg-[#86a98d]/10 px-5 font-[family-name:var(--font-geist-mono)] text-xs tracking-widest text-[#dce9df] transition-[background-color,border-color] hover:border-[#b8d2bd] hover:bg-[#86a98d]/20 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#86a98d] sm:w-auto" onClick={handleClose} type="button">
              {dict.modal.continue}
            </button>
          </div>
        ) : (
          <div className="relative">
            <h2 className="modal-title m-0 font-[family-name:var(--font-alumni-sans)] text-4xl leading-[.95] font-semibold tracking-wide text-[#f4f3ef]" data-text={title} id="auth-modal-title">
              {title}
            </h2>

            <div className="mt-6 flex items-center gap-6 border-b border-white/10 font-[family-name:var(--font-geist-mono)] text-xs tracking-widest">
              <button className="auth-tab cursor-pointer border-0 bg-transparent pb-3 text-[#aaa9a4] data-[active=true]:text-[#dce9df]" data-active={mode === "login"} onClick={() => switchMode("login")} type="button">
                {dict.auth.tabLogin}
              </button>
              <button className="auth-tab cursor-pointer border-0 bg-transparent pb-3 text-[#aaa9a4] data-[active=true]:text-[#dce9df]" data-active={mode === "register"} onClick={() => switchMode("register")} type="button">
                {dict.auth.tabRegister}
              </button>
            </div>

            <form className="mt-6 flex flex-col gap-5" key={mode} onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2">
                <span className="font-[family-name:var(--font-geist-mono)] text-[10px] tracking-widest text-[#aaa9a4]">{dict.auth.emailLabel}</span>
                <input autoComplete="email" className="auth-field" maxLength={254} name="email" placeholder={dict.auth.emailPlaceholder} required type="email" />
              </label>

              {mode === "register" && (
                <label className="flex flex-col gap-2">
                  <span className="font-[family-name:var(--font-geist-mono)] text-[10px] tracking-widest text-[#aaa9a4]">{dict.auth.pseudoLabel}</span>
                  <input autoComplete="username" className="auth-field" maxLength={20} minLength={3} name="pseudo" pattern="[a-zA-Z0-9_]+" placeholder={dict.auth.pseudoPlaceholder} required type="text" />
                </label>
              )}

              <label className="flex flex-col gap-2">
                <span className="font-[family-name:var(--font-geist-mono)] text-[10px] tracking-widest text-[#aaa9a4]">{dict.auth.passwordLabel}</span>
                <input autoComplete={mode === "login" ? "current-password" : "new-password"} className="auth-field" maxLength={72} minLength={8} name="password" placeholder={dict.auth.passwordPlaceholder} required type="password" />
              </label>

              {feedback && <p className="m-0 text-sm leading-5 text-[#d8a2a2]" role="alert">{feedback}</p>}

              <button className="mt-1 min-h-12 w-full cursor-pointer border border-[#86a98d]/55 bg-[#86a98d]/10 px-5 font-[family-name:var(--font-geist-mono)] text-xs tracking-widest text-[#dce9df] transition-[background-color,border-color] hover:border-[#b8d2bd] hover:bg-[#86a98d]/20 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#86a98d] disabled:cursor-wait disabled:opacity-50" disabled={isSubmitting} type="submit">
                {isSubmitting ? dict.auth.submitting : mode === "login" ? dict.auth.submitLogin : dict.auth.submitRegister}
              </button>
            </form>

            {googleClientId ? (
              <>
                <div className="my-6 flex items-center gap-4 text-[10px] tracking-widest text-white/35" aria-hidden="true">
                  <span className="h-px flex-1 bg-white/10" />
                  {dict.auth.orDivider}
                  <span className="h-px flex-1 bg-white/10" />
                </div>
                <div className="flex justify-center" ref={googleButtonRef} />
              </>
            ) : (
              <p className="mt-6 text-center text-xs leading-5 text-white/30">{dict.auth.googleUnavailable}</p>
            )}
          </div>
        )}
      </section>
    </div>,
    document.body,
  );
}
