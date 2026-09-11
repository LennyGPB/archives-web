type PhoneMockupProps = {
  className?: string;
  videoSrc?: string;
};

export default function PhoneMockup({ className = "", videoSrc = "/videos/webvideo2.mp4" }: PhoneMockupProps) {
  return (
    <div
      className={`relative aspect-[9/19.5] rounded-[2.6rem] border-[6px] border-[#1c1d1f] bg-[#1c1d1f] shadow-[0_30px_80px_rgba(0,0,0,.55)] ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 overflow-hidden rounded-[2.1rem] bg-black">
        <video autoPlay className="h-full w-full object-cover" loop muted playsInline src={videoSrc} />
        <span className="absolute top-0 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-[#1c1d1f]" />
      </div>
    </div>
  );
}
