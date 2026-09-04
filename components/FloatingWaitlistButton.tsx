"use client";

import { useEffect, useState } from "react";
import WaitlistCta from "./WaitlistCta";

export default function FloatingWaitlistButton() {
  const [pastHero, setPastHero] = useState(false);
  const [nearWaitlist, setNearWaitlist] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("top");
    const waitlist = document.getElementById("waitlist");
    const heroObserver = new IntersectionObserver(([entry]) => setPastHero(!entry.isIntersecting), { threshold: 0 });
    const waitlistObserver = new IntersectionObserver(([entry]) => setNearWaitlist(entry.isIntersecting), { threshold: 0 });
    if (hero) heroObserver.observe(hero);
    if (waitlist) waitlistObserver.observe(waitlist);
    return () => {
      heroObserver.disconnect();
      waitlistObserver.disconnect();
    };
  }, []);

  const visible = pastHero && !nearWaitlist;

  return (
    <div aria-hidden={!visible} className={`fixed bottom-6 left-1/2 z-40 w-fit max-w-[92vw] -translate-x-1/2 transition-all duration-500 sm:left-6 sm:translate-x-0 ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}>
      <WaitlistCta compact />
    </div>
  );
}
