// Poker Action Icons — 24×24 SVG components

interface IconProps {
  size?: number;
  className?: string;
}

export function FoldIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="4" width="10" height="14" rx="2" fill="#FF4757" opacity="0.2" stroke="#FF4757" strokeWidth="1.5" />
      <rect x="11" y="6" width="10" height="14" rx="2" fill="#FF4757" opacity="0.35"
        stroke="#FF4757" strokeWidth="1.5" transform="rotate(-12 16 13)" />
      <line x1="6" y1="8" x2="10" y2="15" stroke="#FF4757" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="8" x2="6" y2="15" stroke="#FF4757" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" fill="#26A17B" opacity="0.15" stroke="#26A17B" strokeWidth="1.5" />
      <path d="M8 12.5L11 15.5L16.5 9" stroke="#26A17B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CallIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" fill="#26A17B" opacity="0.1" />
      <circle cx="12" cy="12" r="9" stroke="#26A17B" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5" stroke="#26A17B" strokeWidth="1" opacity="0.4" />
      <text x="12" y="12.5" textAnchor="middle" dominantBaseline="central"
        fill="#26A17B" fontSize="7" fontWeight="800" fontFamily="'JetBrains Mono', monospace">₮</text>
    </svg>
  );
}

export function RaiseIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="4" y="6" width="16" height="14" rx="3" fill="#FFD700" opacity="0.1" stroke="#FFD700" strokeWidth="1.5" />
      <path d="M12 16V9" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
      <path d="M8.5 12.5L12 9L15.5 12.5" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AllInIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2C12 2 6 8 6 13C6 16.3137 8.68629 19 12 19C15.3137 19 18 16.3137 18 13C18 8 12 2 12 2Z"
        fill="#FFD700" opacity="0.2" stroke="#FFD700" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 10C12 10 10 12.5 10 14C10 15.1046 10.8954 16 12 16C13.1046 16 14 15.1046 14 14C14 12.5 12 10 12 10Z"
        fill="#FF6B35" opacity="0.6" />
      <line x1="12" y1="19" x2="12" y2="22" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="21" x2="16" y2="21" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
