// Bracket-style "A" mark for Agent Arena — purple triangle, a green skill-arrow
// rising through a 3-node agent tree, and a green recursion loop on the right.
// Drop a real logo PNG into /public and swap this out if you prefer the raster.
export function ArenaLogo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-label="Agent Arena logo"
    >
      <defs>
        <linearGradient id="legGrad" x1="50" y1="20" x2="82" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7cff57" />
          <stop offset="0.55" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      {/* Left leg of the A (purple) */}
      <path d="M21 84 L47 24" stroke="#8b5cf6" strokeWidth="7" strokeLinecap="round" />
      {/* Right leg of the A (purple → green) */}
      <path d="M53 24 L79 84" stroke="url(#legGrad)" strokeWidth="7" strokeLinecap="round" />

      {/* Agent tree bus + legs */}
      <path
        d="M34 58 H66 M34 58 V68 M66 58 V68 M50 58 V52"
        stroke="#8b5cf6"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Three agent nodes */}
      <circle cx="34" cy="71" r="4.5" fill="#8b5cf6" />
      <circle cx="66" cy="71" r="4.5" fill="#8b5cf6" />
      <circle cx="50" cy="71" r="4.5" fill="#7cff57" />

      {/* Green skill-arrow rising up through the apex */}
      <path d="M50 54 V20" stroke="#7cff57" strokeWidth="5" strokeLinecap="round" />
      <path d="M43 27 L50 15 L57 27" stroke="#7cff57" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Recursion loop on the right */}
      <path d="M72 30 C92 42 92 70 76 80" stroke="#7cff57" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <path d="M66 33 L73 28 L77 36" stroke="#7cff57" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
