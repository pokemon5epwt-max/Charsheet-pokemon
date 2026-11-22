export function PokedexLens({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 shrink-0" aria-hidden="true">
      <svg viewBox="0 0 36 36" className={className} fill="none">
        <circle cx="18" cy="18" r="16" fill="#1E293B" stroke="#E2E8F0" strokeWidth="2.2" />
        <circle cx="18" cy="18" r="11.5" fill="url(#pokedex-lens-grad)" stroke="#0EA5E9" strokeWidth="1.2" />
        <ellipse cx="14" cy="13.5" rx="4" ry="2.4" transform="rotate(-25 14 13.5)" fill="#E0F2FE" fillOpacity="0.85" />
        <circle cx="22.5" cy="22.5" r="1.5" fill="#BAE6FD" fillOpacity="0.65" />
        <defs>
          <radialGradient id="pokedex-lens-grad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(14 13) rotate(50) scale(18)">
            <stop stopColor="#38BDF8" />
            <stop offset="0.6" stopColor="#0284C7" />
            <stop offset="1" stopColor="#0C4A6E" />
          </radialGradient>
        </defs>
      </svg>
      <div className="hidden sm:flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-rose-500 border border-rose-300/40" />
        <span className="w-2 h-2 rounded-full bg-amber-400 border border-amber-200/40" />
        <span className="w-2 h-2 rounded-full bg-emerald-400 border border-emerald-200/40" />
      </div>
    </div>
  );
}

export type BallVariant = 'poke' | 'great' | 'ultra' | 'fainted';

export function PokeballIcon({
  variant = 'poke',
  className = 'w-5 h-5',
}: {
  variant?: BallVariant;
  className?: string;
}) {
  const topColor =
    variant === 'great'
      ? '#2563EB'
      : variant === 'ultra'
        ? '#1E293B'
        : variant === 'fainted'
          ? '#475569'
          : '#E11D48';

  const bottomColor = variant === 'fainted' ? '#1E293B' : '#E2E8F0';

  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      {/* Top Hemisphere */}
      <path
        d="M4 16C4 9.373 9.373 4 16 4C22.627 4 28 9.373 28 16H4Z"
        fill={topColor}
      />
      {/* Great Ball Crimson Stripes */}
      {variant === 'great' && (
        <>
          <path d="M7.5 8.5L11.5 12.5" stroke="#EF4444" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M24.5 8.5L20.5 12.5" stroke="#EF4444" strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
      {/* Ultra Ball Gold Arc */}
      {variant === 'ultra' && (
        <path
          d="M9 7.5C11 6 13.4 5.2 16 5.2C18.6 5.2 21 6 23 7.5"
          stroke="#FACC15"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      )}
      {/* Bottom Hemisphere */}
      <path
        d="M4 16H28C28 22.627 22.627 28 16 28C9.373 28 4 22.627 4 16Z"
        fill={bottomColor}
      />
      {/* Outer Rim & Center Band */}
      <circle cx="16" cy="16" r="12" stroke="#0F1117" strokeWidth="2" />
      <path d="M4 16H28" stroke="#0F1117" strokeWidth="2.4" />
      {/* Center Button */}
      <circle cx="16" cy="16" r="4" fill="#0F1117" />
      <circle
        cx="16"
        cy="16"
        r="2.2"
        fill={variant === 'fainted' ? '#64748B' : '#F8FAFC'}
      />
    </svg>
  );
}

export function LeagueBadgeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 2L19 6.5V15.5L12 22L5 15.5V6.5L12 2Z"
        fill="#F59E0B"
        fillOpacity="0.2"
        stroke="#FBBF24"
        strokeWidth="1.8"
      />
      <path
        d="M12 6.5L15.5 9.5V14L12 17.5L8.5 14V9.5L12 6.5Z"
        fill="#FBBF24"
      />
    </svg>
  );
}

export function PokeballBackdrop({
  colorHex = '#E11D48',
}: {
  colorHex?: string;
}) {
  return (
    <svg
      viewBox="0 0 180 180"
      className="w-40 h-40 pointer-events-none select-none opacity-[0.09]"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="90" cy="90" r="76" stroke={colorHex} strokeWidth="6" />
      <path d="M14 90H64M116 90H166" stroke={colorHex} strokeWidth="6" strokeLinecap="round" />
      <circle cx="90" cy="90" r="24" stroke={colorHex} strokeWidth="6" />
      <circle cx="90" cy="90" r="10" fill={colorHex} />
    </svg>
  );
}
