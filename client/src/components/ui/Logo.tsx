interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: { container: 'w-20 h-20', text: 'text-xs', gap: 'mt-1' },
    md: { container: 'w-28 h-28', text: 'text-sm', gap: 'mt-2' },
    lg: { container: 'w-36 h-36', text: 'text-base', gap: 'mt-3' },
  };

  return (
    <div className="">
      {/* Logo Container with Wings and Center Emblem */}
      <div className={`${sizes[size].container} relative flex items-center justify-center`}>
        <svg viewBox="0 0 120 100" className="">
          {/* Left Wing/Laurel */}
          <g fill="#C4A052" transform="translate(5, 15)">
            <path d="M25 35 Q15 25 10 40 Q5 55 15 50 Q10 45 15 35 Q20 25 25 35" />
            <path d="M20 45 Q10 38 5 52 Q0 66 12 58 Q5 53 10 42 Q15 32 20 45" />
            <path d="M22 55 Q12 50 8 63 Q4 76 15 68 Q8 62 12 52 Q17 42 22 55" />
            <path d="M25 25 Q18 18 15 30 Q12 42 20 37 Q14 33 17 25 Q21 17 25 25" />
            <path d="M28 18 Q22 12 20 22 Q18 32 25 28 Q20 25 22 18 Q26 11 28 18" />
          </g>
          
          {/* Right Wing/Laurel (mirrored) */}
          <g fill="#C4A052" transform="translate(115, 15) scale(-1, 1)">
            <path d="M25 35 Q15 25 10 40 Q5 55 15 50 Q10 45 15 35 Q20 25 25 35" />
            <path d="M20 45 Q10 38 5 52 Q0 66 12 58 Q5 53 10 42 Q15 32 20 45" />
            <path d="M22 55 Q12 50 8 63 Q4 76 15 68 Q8 62 12 52 Q17 42 22 55" />
            <path d="M25 25 Q18 18 15 30 Q12 42 20 37 Q14 33 17 25 Q21 17 25 25" />
            <path d="M28 18 Q22 12 20 22 Q18 32 25 28 Q20 25 22 18 Q26 11 28 18" />
          </g>

          {/* Center Shield/Emblem Background */}
          <ellipse cx="60" cy="50" rx="28" ry="35" fill="#1E88E5" />
          <ellipse cx="60" cy="50" rx="24" ry="31" fill="#42A5F5" />
          
          {/* Torch/Flame */}
          <g transform="translate(60, 20)">
            {/* Flame Outer */}
            <path d="M0 0 Q-8 15 -6 25 Q-4 35 0 40 Q4 35 6 25 Q8 15 0 0" fill="#E53935" />
            {/* Flame Inner */}
            <path d="M0 5 Q-4 15 -3 22 Q-2 29 0 33 Q2 29 3 22 Q4 15 0 5" fill="#FF9800" />
            {/* Flame Core */}
            <path d="M0 10 Q-2 18 -1 23 Q0 28 0 28 Q0 28 1 23 Q2 18 0 10" fill="#FFC107" />
          </g>

          {/* Small Bus Icon at Bottom */}
          <g transform="translate(45, 55)">
            {/* Bus Body */}
            <rect x="0" y="4" width="30" height="14" rx="2" fill="#1565C0" />
            {/* Windows */}
            <rect x="3" y="6" width="5" height="5" rx="1" fill="#BBDEFB" />
            <rect x="10" y="6" width="5" height="5" rx="1" fill="#BBDEFB" />
            <rect x="17" y="6" width="5" height="5" rx="1" fill="#BBDEFB" />
            <rect x="24" y="6" width="3" height="5" rx="1" fill="#BBDEFB" />
            {/* Front */}
            <rect x="0" y="13" width="30" height="4" fill="#0D47A1" />
            {/* Wheels */}
            <circle cx="7" cy="20" r="3" fill="#37474F" />
            <circle cx="23" cy="20" r="3" fill="#37474F" />
            <circle cx="7" cy="20" r="1.5" fill="#78909C" />
            <circle cx="23" cy="20" r="1.5" fill="#78909C" />
          </g>
        </svg>
      </div>

      {/* Text */}
      {showText && (
        <div className={`${sizes[size].gap} font-bold text-center tracking-wider`}>
          <span className={`text-gray-800 ${sizes[size].text}`}>BUS SMART SYSTEM</span>
        </div>
      )}
    </div>
  );
}

