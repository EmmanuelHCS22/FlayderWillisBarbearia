import React from 'react';

interface PremiumIconProps {
  name: 'scissors' | 'beard' | 'combo' | 'hair' | 'straight' | 'platinum' | 'eyebrow' | 'dye' | 'calendar' | 'whatsapp' | 'instagram' | 'clock' | 'check' | 'shield' | 'star' | 'lock';
  className?: string;
  size?: number;
}

export const PremiumIcon: React.FC<PremiumIconProps> = ({ name, className = '', size = 28 }) => {
  const gradientId = `gold-grad-${name}-${Math.random().toString(36).substr(2, 9)}`;

  // SVG 3D-styled metallic gold vector icons with rich gradients and drop shadows
  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_4px_10px_rgba(212,175,55,0.35)] transition-transform duration-300"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF1B8" />
            <stop offset="35%" stopColor="#E5C158" />
            <stop offset="70%" stopColor="#B38728" />
            <stop offset="100%" stopColor="#FBF5B7" />
          </linearGradient>
          <radialGradient id={`${gradientId}-shine`} cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#E5C158" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8A6718" stopOpacity="0" />
          </radialGradient>
          <filter id={`${gradientId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {name === 'scissors' && (
          <g filter={`url(#${gradientId}-glow)`}>
            {/* Scissor Blades & Loops */}
            <circle cx="20" cy="46" r="10" stroke={`url(#${gradientId})`} strokeWidth="4.5" fill="none" />
            <circle cx="44" cy="46" r="10" stroke={`url(#${gradientId})`} strokeWidth="4.5" fill="none" />
            <path
              d="M26 39L46 12C47 10 49 10 50 12L52 14"
              stroke={`url(#${gradientId})`}
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <path
              d="M38 39L18 12C17 10 15 10 14 12L12 14"
              stroke={`url(#${gradientId})`}
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <circle cx="32" cy="30" r="3.5" fill={`url(#${gradientId})`} />
            <circle cx="32" cy="30" r="1.5" fill="#0A0A0A" />
          </g>
        )}

        {name === 'beard' && (
          <g filter={`url(#${gradientId}-glow)`}>
            {/* Beard / Razor Silhouette */}
            <path
              d="M16 18C16 18 20 12 32 12C44 12 48 18 48 18C52 28 50 40 44 48C38 56 32 58 32 58C32 58 26 56 20 48C14 40 12 28 16 18Z"
              stroke={`url(#${gradientId})`}
              strokeWidth="3.5"
              fill="url(#gold-plate)"
              fillOpacity="0.15"
            />
            {/* Mustache contour */}
            <path
              d="M22 26C26 24 30 27 32 30C34 27 38 24 42 26C45 28 47 33 46 35C40 34 35 37 32 41C29 37 24 34 18 35C17 33 19 28 22 26Z"
              fill={`url(#${gradientId})`}
            />
            <path
              d="M28 44C30 46 34 46 36 44"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        )}

        {name === 'combo' && (
          <g filter={`url(#${gradientId}-glow)`}>
            {/* Combo: Scissors + Crown */}
            <path
              d="M14 26L20 42H44L50 26L38 32L32 18L26 32L14 26Z"
              stroke={`url(#${gradientId})`}
              strokeWidth="3.5"
              strokeLinejoin="round"
              fill={`url(#${gradientId})`}
              fillOpacity="0.25"
            />
            <circle cx="14" cy="24" r="2.5" fill={`url(#${gradientId})`} />
            <circle cx="32" cy="16" r="3" fill={`url(#${gradientId})`} />
            <circle cx="50" cy="24" r="2.5" fill={`url(#${gradientId})`} />
            <path
              d="M24 48H40"
              stroke={`url(#${gradientId})`}
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>
        )}

        {name === 'hair' && (
          <g filter={`url(#${gradientId}-glow)`}>
            {/* Modern Hair Pompadour Cut Flow */}
            <path
              d="M14 36C12 24 20 12 34 10C48 8 52 18 52 24C52 30 46 34 44 42C43 46 40 50 36 52C28 56 16 48 14 36Z"
              stroke={`url(#${gradientId})`}
              strokeWidth="3.5"
              fill={`url(#${gradientId})`}
              fillOpacity="0.2"
            />
            <path
              d="M22 26C28 20 38 20 44 26"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M26 33C30 28 38 28 42 33"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        )}

        {name === 'straight' && (
          <g filter={`url(#${gradientId}-glow)`}>
            {/* Alisamento / Hair straightener plates */}
            <path
              d="M14 18L44 48"
              stroke={`url(#${gradientId})`}
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M20 12L50 42"
              stroke={`url(#${gradientId})`}
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M32 30L40 22"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        )}

        {name === 'platinum' && (
          <g filter={`url(#${gradientId}-glow)`}>
            {/* Diamond / Sparkle Platinum */}
            <polygon
              points="32,8 52,24 44,52 20,52 12,24"
              stroke={`url(#${gradientId})`}
              strokeWidth="3.5"
              fill={`url(#${gradientId})`}
              fillOpacity="0.2"
            />
            <line x1="12" y1="24" x2="52" y2="24" stroke={`url(#${gradientId})`} strokeWidth="2.5" />
            <line x1="32" y1="8" x2="28" y2="52" stroke={`url(#${gradientId})`} strokeWidth="2" />
            <line x1="32" y1="8" x2="36" y2="52" stroke={`url(#${gradientId})`} strokeWidth="2" />
          </g>
        )}

        {name === 'eyebrow' && (
          <g filter={`url(#${gradientId}-glow)`}>
            {/* Elegant eyebrow blade arc */}
            <path
              d="M12 36C18 24 34 20 52 26C42 28 32 32 24 40C20 42 15 40 12 36Z"
              fill={`url(#${gradientId})`}
            />
            <circle cx="48" cy="24" r="2" fill="#FFFFFF" />
          </g>
        )}

        {name === 'dye' && (
          <g filter={`url(#${gradientId}-glow)`}>
            {/* Hair color brush / palette */}
            <path
              d="M18 48L38 28L44 34L24 54L16 56L18 48Z"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              fill={`url(#${gradientId})`}
              fillOpacity="0.25"
            />
            <path
              d="M38 28L46 20C49 17 54 17 57 20C60 23 60 28 57 31L49 39L38 28Z"
              fill={`url(#${gradientId})`}
            />
          </g>
        )}

        {name === 'calendar' && (
          <g filter={`url(#${gradientId}-glow)`}>
            <rect
              x="12"
              y="16"
              width="40"
              height="38"
              rx="6"
              stroke={`url(#${gradientId})`}
              strokeWidth="3.5"
              fill="#0A0A0A"
            />
            <line x1="12" y1="26" x2="52" y2="26" stroke={`url(#${gradientId})`} strokeWidth="3" />
            <line x1="22" y1="11" x2="22" y2="18" stroke={`url(#${gradientId})`} strokeWidth="3.5" strokeLinecap="round" />
            <line x1="42" y1="11" x2="42" y2="18" stroke={`url(#${gradientId})`} strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="22" cy="34" r="2.5" fill={`url(#${gradientId})`} />
            <circle cx="32" cy="34" r="2.5" fill={`url(#${gradientId})`} />
            <circle cx="42" cy="34" r="2.5" fill={`url(#${gradientId})`} />
            <circle cx="22" cy="44" r="2.5" fill={`url(#${gradientId})`} />
            <circle cx="32" cy="44" r="2.5" fill={`url(#${gradientId})`} />
            <circle cx="42" cy="44" r="2.5" fill={`url(#${gradientId})`} />
          </g>
        )}

        {name === 'clock' && (
          <g filter={`url(#${gradientId}-glow)`}>
            <circle
              cx="32"
              cy="32"
              r="22"
              stroke={`url(#${gradientId})`}
              strokeWidth="3.5"
              fill="#0A0A0A"
            />
            <polyline
              points="32,18 32,32 42,38"
              stroke={`url(#${gradientId})`}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="32" cy="32" r="3" fill={`url(#${gradientId})`} />
          </g>
        )}

        {name === 'whatsapp' && (
          <g filter={`url(#${gradientId}-glow)`}>
            <circle cx="32" cy="32" r="22" stroke={`url(#${gradientId})`} strokeWidth="3" fill="#0A0A0A" />
            <path
              d="M44 32C44 38.6 38.6 44 32 44C29.8 44 27.7 43.4 25.9 42.4L20 44L21.7 38.3C20.6 36.4 20 34.3 20 32C20 25.4 25.4 20 32 20C38.6 20 44 25.4 44 32Z"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.5"
              fill={`url(#${gradientId})`}
              fillOpacity="0.3"
            />
            <path
              d="M27 27C27.5 28.5 29.5 32.5 33.5 34.5C34.5 35 35.5 34.5 36 34L37 32.5C37.5 32 37 31.5 36.5 31.2L34.5 30.2C34 30 33.5 30.2 33.2 30.5L32.7 31C32 30.6 30.5 29.5 29.8 28.5L30.5 28C30.8 27.7 31 27.2 30.8 26.7L29.8 24.7C29.5 24.2 29 23.7 28.5 24.2L27 25.2C26.5 25.7 26.5 26.5 27 27Z"
              fill={`url(#${gradientId})`}
            />
          </g>
        )}

        {name === 'instagram' && (
          <g filter={`url(#${gradientId}-glow)`}>
            <rect
              x="14"
              y="14"
              width="36"
              height="36"
              rx="10"
              stroke={`url(#${gradientId})`}
              strokeWidth="3.5"
              fill="#0A0A0A"
            />
            <circle cx="32" cy="32" r="9" stroke={`url(#${gradientId})`} strokeWidth="3" />
            <circle cx="41" cy="23" r="2.5" fill={`url(#${gradientId})`} />
          </g>
        )}

        {name === 'check' && (
          <g filter={`url(#${gradientId}-glow)`}>
            <circle cx="32" cy="32" r="22" stroke={`url(#${gradientId})`} strokeWidth="3.5" fill="#0A0A0A" />
            <polyline
              points="22,32 29,39 42,24"
              stroke={`url(#${gradientId})`}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}

        {name === 'shield' && (
          <g filter={`url(#${gradientId}-glow)`}>
            <path
              d="M32 10L16 17V30C16 42 23 50 32 54C41 50 48 42 48 30V17L32 10Z"
              stroke={`url(#${gradientId})`}
              strokeWidth="3.5"
              fill={`url(#${gradientId})`}
              fillOpacity="0.2"
            />
            <polyline
              points="24,31 30,37 40,26"
              stroke={`url(#${gradientId})`}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}

        {name === 'star' && (
          <polygon
            points="32,10 38,24 53,25 41,35 45,50 32,41 19,50 23,35 11,25 26,24"
            fill={`url(#${gradientId})`}
            filter={`url(#${gradientId}-glow)`}
          />
        )}

        {name === 'lock' && (
          <g filter={`url(#${gradientId}-glow)`}>
            <rect
              x="18"
              y="26"
              width="28"
              height="26"
              rx="5"
              stroke={`url(#${gradientId})`}
              strokeWidth="3.5"
              fill="#0A0A0A"
            />
            <path
              d="M23 26V19C23 14 27 10 32 10C37 10 41 14 41 19V26"
              stroke={`url(#${gradientId})`}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="32" cy="38" r="2.5" fill={`url(#${gradientId})`} />
          </g>
        )}
      </svg>
    </div>
  );
};
