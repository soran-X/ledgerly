/**
 * Ledgerly logo mark.
 *
 * Concept: the "L" of Ledgerly morphs into a checkmark at its base —
 * the vertical stroke goes down and the foot sweeps diagonally up-right
 * like a ledger tick. Witty shorthand: "Ledger ✓".
 */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Ledgerly"
    >
      {/* Violet rounded square background */}
      <rect width="40" height="40" rx="10" fill="oklch(0.558 0.24 292)" />

      {/* L ⟶ checkmark: vertical bar goes down, base sweeps up-right */}
      <path
        d="M 12 8 L 12 28 L 31 14"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Subtle ledger rule across the vertical bar — makes it literally a ledger */}
      <line x1="12" y1="16" x2="19" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
      <line x1="12" y1="22" x2="17" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    </svg>
  )
}

/** Full wordmark: icon + "Ledgerly" text, sized together. */
export function LogoWordmark({ iconSize = 32 }: { iconSize?: number }) {
  const fontSize = Math.round(iconSize * 0.6)
  return (
    <span className="flex items-center gap-2">
      <LogoMark size={iconSize} />
      <span
        style={{ fontSize: `${fontSize}px`, lineHeight: 1 }}
        className="font-bold tracking-tight text-primary"
      >
        Ledgerly
      </span>
    </span>
  )
}
