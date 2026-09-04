/**
 * The italic word with its two colour ghosts and scanline, used in every
 * section heading. Extracted so a translated word only has to be written once.
 */
export default function GlitchWord({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span className={`title-traces relative inline-block ${className}`}>
      <span className="title-traces-main relative z-[1] block">{children}</span>
      <span className="glitch-ghost glitch-ghost-eden pointer-events-none absolute inset-0 z-[2] block text-[#86a98d]" aria-hidden="true">{children}</span>
      <span className="glitch-ghost glitch-ghost-white pointer-events-none absolute inset-0 z-[2] block text-[#f4f3ef]" aria-hidden="true">{children}</span>
      <span className="glitch-scanline pointer-events-none absolute top-[58%] right-0 left-0 z-[3] h-0.5 bg-[#86a98d]" aria-hidden="true" />
    </span>
  );
}
