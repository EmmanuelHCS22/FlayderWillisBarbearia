import React from 'react';

interface PremiumIconProps {
  name: 'scissors' | 'beard' | 'combo' | 'hair' | 'straight' | 'platinum' | 'eyebrow' | 'dye' | 'calendar' | 'whatsapp' | 'instagram' | 'google' | 'clock' | 'check' | 'shield' | 'star' | 'lock' | 'location' | 'google-maps' | 'waze';
  className?: string;
  size?: number;
}

export const PremiumIcon: React.FC<PremiumIconProps> = ({ name, className = '', size = 28 }) => {
  const gradientId = `gold-grad-${name}-${Math.random().toString(36).substr(2, 9)}`;

  // 1. WhatsApp in official green with white speech bubble
  if (name === 'whatsapp') {
    return (
      <div className={`relative inline-flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 48 48"
          width={size}
          height={size}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_2px_8px_rgba(37,211,102,0.45)] transition-transform duration-300"
        >
          <circle cx="24" cy="24" r="22" fill="#25D366" />
          <defs>
            <radialGradient id="wa-shine" cx="30%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#25D366" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="24" cy="24" r="22" fill="url(#wa-shine)" />

          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M24 10C16.268 10 10 16.268 10 24C10 26.732 10.776 29.352 12.248 31.624L11 37L16.584 35.808C18.776 37.128 21.328 37.848 24 37.848C31.732 37.848 38 31.58 38 23.848C38 16.116 31.732 10 24 10ZM31.112 28.512C30.824 29.328 29.688 30.016 28.848 30.192C28.272 30.312 27.528 30.408 25.008 29.36C21.784 28.024 19.704 24.752 19.544 24.536C19.392 24.328 18.248 22.808 18.248 21.232C18.248 19.656 19.048 18.888 19.368 18.56C19.632 18.288 20.064 18.16 20.48 18.16C20.616 18.16 20.736 18.168 20.848 18.176C21.176 18.192 21.344 18.208 21.56 18.728C21.832 19.384 22.488 20.992 22.568 21.16C22.648 21.328 22.728 21.552 22.616 21.776C22.512 22.008 22.424 22.104 22.264 22.288C22.104 22.472 21.952 22.616 21.792 22.808C21.648 22.976 21.48 23.16 21.656 23.464C21.832 23.76 22.44 24.752 23.336 25.552C24.496 26.584 25.44 26.912 25.776 27.056C26.032 27.16 26.336 27.136 26.528 26.928C26.776 26.664 27.08 26.224 27.392 25.792C27.616 25.48 27.896 25.44 28.192 25.552C28.496 25.656 30.128 26.464 30.464 26.632C30.8 26.8 31.024 26.88 31.104 27.024C31.184 27.168 31.184 27.8 31.112 28.512Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>
    );
  }

  // 2. Instagram in official vibrant gradient with camera symbol
  if (name === 'instagram') {
    const igGradId = `ig-grad-${Math.random().toString(36).substr(2, 9)}`;
    return (
      <div className={`relative inline-flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 48 48"
          width={size}
          height={size}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_2px_8px_rgba(225,48,108,0.45)] transition-transform duration-300"
        >
          <defs>
            <radialGradient id={`${igGradId}-radial`} cx="20%" cy="100%" r="100%">
              <stop offset="0%" stopColor="#FFDC80" />
              <stop offset="10%" stopColor="#FCAF45" />
              <stop offset="30%" stopColor="#F77737" />
              <stop offset="50%" stopColor="#F56040" />
              <stop offset="75%" stopColor="#FD1D1D" />
              <stop offset="100%" stopColor="#E1306C" />
            </radialGradient>
            <linearGradient id={`${igGradId}-linear`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#405DE6" />
              <stop offset="30%" stopColor="#5851DB" />
              <stop offset="60%" stopColor="#833AB4" />
              <stop offset="85%" stopColor="#C13584" />
              <stop offset="100%" stopColor="#E1306C" />
            </linearGradient>
          </defs>

          <rect x="4" y="4" width="40" height="40" rx="11" fill={`url(#${igGradId}-linear)`} />
          <rect x="4" y="4" width="40" height="40" rx="11" fill={`url(#${igGradId}-radial)`} fillOpacity="0.85" />

          <rect x="11.5" y="11.5" width="25" height="25" rx="7" stroke="#FFFFFF" strokeWidth="2.8" />
          <circle cx="24" cy="24" r="6" stroke="#FFFFFF" strokeWidth="2.8" />
          <circle cx="31.5" cy="16.5" r="1.6" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  // 3. Google in official 4-color brand design
  if (name === 'google') {
    return (
      <div className={`relative inline-flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 48 48"
          width={size}
          height={size}
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_2px_8px_rgba(66,133,244,0.35)] transition-transform duration-300"
        >
          <circle cx="24" cy="24" r="22" fill="#18181B" stroke="#27272A" strokeWidth="1" />
          
          <path
            d="M34.6 24.3c0-.7-.1-1.4-.2-2.1H24v4.2h6c-.3 1.4-1.1 2.6-2.3 3.4v2.8h3.7c2.2-2 3.4-5 3.4-8.3z"
            fill="#4285F4"
          />
          <path
            d="M24 35c3.2 0 6-1.1 8-2.9l-3.7-2.8c-1.1.7-2.5 1.2-4.3 1.2-3.3 0-6.1-2.2-7.1-5.3h-3.9v3c2 4 6.2 6.8 11 6.8z"
            fill="#34A853"
          />
          <path
            d="M16.9 25.2c-.3-.8-.4-1.6-.4-2.5 0-.9.2-1.7.4-2.5v-3H13c-.9 1.7-1.4 3.6-1.4 5.5s.5 3.8 1.4 5.5l3.9-3z"
            fill="#FBBC05"
          />
          <path
            d="M24 16.5c1.8 0 3.3.6 4.6 1.8l3.4-3.4C29.9 13 27.2 12 24 12c-4.8 0-9 2.8-11 6.8l3.9 3c1-3.1 3.8-5.3 7.1-5.3z"
            fill="#EA4335"
          />
        </svg>
      </div>
    );
  }

  // 4. Google Maps Pin Icon with authentic colors
  if (name === 'google-maps') {
    return (
      <div className={`relative inline-flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 48 48"
          width={size}
          height={size}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_2px_8px_rgba(234,67,53,0.35)]"
        >
          <path
            d="M24 6C16.27 6 10 12.27 10 20C10 29.5 24 42 24 42C24 42 38 29.5 38 20C38 12.27 31.73 6 24 6Z"
            fill="#EA4335"
          />
          <path
            d="M24 6C16.27 6 10 12.27 10 20C10 24.5 12.5 29.5 16 34L24 42V6Z"
            fill="#4285F4"
          />
          <path
            d="M24 6C20 6 17 8 15 11L24 20H34C34 12.27 29.5 6 24 6Z"
            fill="#FBBC05"
          />
          <path
            d="M24 42C24 42 32 34 35 28L24 20V42Z"
            fill="#34A853"
          />
          <circle cx="24" cy="20" r="6" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  // 5. Waze Icon with authentic cyan-blue and cute smiley car design
  if (name === 'waze') {
    return (
      <div className={`relative inline-flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 48 48"
          width={size}
          height={size}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_2px_8px_rgba(51,204,255,0.45)]"
        >
          {/* Circular badge */}
          <circle cx="24" cy="24" r="22" fill="#33CCFF" />
          {/* Ghost car white silhouette */}
          <path
            d="M35 24C35 17.9 30.1 13 24 13C17.9 13 13 17.9 13 24C13 29.4 17 33.9 22.1 34.8C22.6 35.8 23.4 36.6 24.5 36.9C25.5 37.1 26.6 36.8 27.3 36C28.2 36 29 36 29.8 35.8C32.8 35 35 32.3 35 29V24Z"
            fill="#FFFFFF"
          />
          {/* Wheels */}
          <circle cx="19" cy="35" r="3.2" fill="#000000" />
          <circle cx="29" cy="35" r="3.2" fill="#000000" />
          <circle cx="19" cy="35" r="1.5" fill="#FFFFFF" />
          <circle cx="29" cy="35" r="1.5" fill="#FFFFFF" />
          {/* Eyes */}
          <circle cx="28" cy="22" r="2.2" fill="#000000" />
          <circle cx="20" cy="22" r="2.2" fill="#000000" />
          {/* Smile */}
          <path
            d="M21.5 26.5C22.5 28 25.5 28 26.5 26.5"
            stroke="#000000"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  // 6. 3D Premium Gold Location / Map Pin Icon
  if (name === 'location') {
    return (
      <div className={`relative inline-flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_4px_12px_rgba(212,175,55,0.45)] transition-transform duration-300"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF1B8" />
              <stop offset="35%" stopColor="#E5C158" />
              <stop offset="70%" stopColor="#B38728" />
              <stop offset="100%" stopColor="#FBF5B7" />
            </linearGradient>
            <filter id={`${gradientId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <g filter={`url(#${gradientId}-glow)`}>
            {/* Ground pulse shadow */}
            <ellipse cx="32" cy="54" rx="14" ry="4.5" fill={`url(#${gradientId})`} fillOpacity="0.3" />
            
            {/* 3D Map Pin Body */}
            <path
              d="M32 10C21 10 14 18 14 27C14 39 32 54 32 54C32 54 50 39 50 27C50 18 43 10 32 10Z"
              stroke={`url(#${gradientId})`}
              strokeWidth="4"
              strokeLinejoin="round"
              fill={`url(#${gradientId})`}
              fillOpacity="0.25"
            />
            {/* Inner jewel circle */}
            <circle cx="32" cy="26" r="7" stroke={`url(#${gradientId})`} strokeWidth="3.5" fill="#0A0A0A" />
            <circle cx="32" cy="26" r="3.5" fill={`url(#${gradientId})`} />
          </g>
        </svg>
      </div>
    );
  }

  // Other barber service icons retain the exclusive gold identity
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
          <filter id={`${gradientId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {name === 'scissors' && (
          <g filter={`url(#${gradientId}-glow)`}>
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
            <path
              d="M16 18C16 18 20 12 32 12C44 12 48 18 48 18C52 28 50 40 44 48C38 56 32 58 32 58C32 58 26 56 20 48C14 40 12 28 16 18Z"
              stroke={`url(#${gradientId})`}
              strokeWidth="3.5"
              fill={`url(#${gradientId})`}
              fillOpacity="0.15"
            />
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
            <path
              d="M12 36C18 24 34 20 52 26C42 28 32 32 24 40C20 42 15 40 12 36Z"
              fill={`url(#${gradientId})`}
            />
            <circle cx="48" cy="24" r="2" fill="#FFFFFF" />
          </g>
        )}

        {name === 'dye' && (
          <g filter={`url(#${gradientId}-glow)`}>
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
