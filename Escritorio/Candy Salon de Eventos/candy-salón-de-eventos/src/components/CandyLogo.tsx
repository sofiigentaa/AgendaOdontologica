import React from 'react';

interface CandyLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  variant?: 'full' | 'icon' | 'badge';
}

export const CandyLogo: React.FC<CandyLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  variant = 'full',
}) => {
  // Dimensions based on size
  const heightMap = {
    sm: 'h-8',
    md: 'h-11',
    lg: 'h-14',
    xl: 'h-20',
  };

  const currentHeight = heightMap[size] || 'h-11';

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${currentHeight} aspect-square ${className}`}>
        <svg
          viewBox="0 0 100 130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          {/* Top candy wrapper wing */}
          <g>
            <path
              d="M32 46 C 24 34, 12 20, 18 10 C 28 8, 42 16, 50 8 C 58 16, 72 8, 82 10 C 88 20, 76 34, 68 46 Z"
              fill="#6C8EBF"
            />
            {/* Wrapper creases & highlights */}
            <path
              d="M35 14 C 40 24, 46 36, 49 44"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeOpacity="0.8"
            />
            <path
              d="M65 14 C 60 24, 54 36, 51 44"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeOpacity="0.8"
            />
            {/* Top wrapper tie band */}
            <rect x="30" y="44" width="40" height="4" rx="2" fill="#5879A8" />
          </g>

          {/* Main Candy Body (Letter 'C') */}
          <path
            d="M 72 58 C 65 52, 54 48, 42 53 C 27 60, 22 75, 23 88 C 24 100, 31 112, 45 116 C 56 119, 68 116, 74 108"
            stroke="#6C8EBF"
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Specular highlights on 'C' */}
          <path
            d="M 33 67 C 30 76, 30 87, 34 98"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeOpacity="0.85"
          />

          {/* Bottom candy wrapper wing */}
          <g>
            <rect x="30" y="118" width="40" height="4" rx="2" fill="#5879A8" />
            <path
              d="M32 120 C 24 132, 12 146, 18 156 C 28 158, 42 150, 50 158 C 58 150, 72 158, 82 156 C 88 146, 76 132, 68 120 Z"
              fill="#6C8EBF"
            />
            {/* Wrapper creases & highlights */}
            <path
              d="M35 152 C 40 142, 46 130, 49 122"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeOpacity="0.8"
            />
            <path
              d="M65 152 C 60 142, 54 130, 51 122"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeOpacity="0.8"
            />
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        viewBox="0 0 310 155"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${currentHeight} w-auto drop-shadow-xs`}
      >
        {/* === CANDY 'C' WITH WRAPPER WINGS === */}
        <g id="candy-letter-c">
          {/* Top wrapper wing */}
          <g id="top-wrapper">
            <path
              d="M 28 40 C 21 28, 12 14, 17 5 C 26 3, 38 10, 45 4 C 52 10, 64 3, 73 5 C 78 14, 69 28, 62 40 Z"
              fill="#6C8EBF"
            />
            {/* Top creases/highlights */}
            <path
              d="M 30 8 C 35 18, 41 29, 44 37"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeOpacity="0.8"
            />
            <path
              d="M 59 8 C 55 18, 49 29, 46 37"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeOpacity="0.8"
            />
            <rect x="26" y="38" width="38" height="4" rx="2" fill="#5A7BA8" />
          </g>

          {/* Letter 'C' Curve */}
          <path
            d="M 66 52 C 58 46, 47 43, 36 47 C 22 53, 16 67, 17 79 C 18 90, 25 101, 38 104 C 48 107, 59 104, 65 97"
            stroke="#6C8EBF"
            strokeWidth="14.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Specular White Highlight inside 'C' */}
          <path
            d="M 26 61 C 23 69, 23 79, 27 88"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeOpacity="0.85"
          />

          {/* Bottom wrapper wing */}
          <g id="bottom-wrapper">
            <rect x="26" y="103" width="38" height="4" rx="2" fill="#5A7BA8" />
            <path
              d="M 28 105 C 21 117, 12 131, 17 140 C 26 142, 38 135, 45 141 C 52 135, 64 142, 73 140 C 78 131, 69 117, 62 105 Z"
              fill="#6C8EBF"
            />
            {/* Bottom creases/highlights */}
            <path
              d="M 30 137 C 35 127, 41 116, 44 108"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeOpacity="0.8"
            />
            <path
              d="M 59 137 C 55 127, 49 116, 46 108"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeOpacity="0.8"
            />
          </g>
        </g>

        {/* === 'a' (Coral / Pink) === */}
        <g id="letter-a">
          {/* Bowl */}
          <circle cx="103" cy="80" r="19" stroke="#F6A2B3" strokeWidth="11" fill="none" />
          {/* Stem / Right Tail */}
          <path
            d="M 121 62 L 121 95 C 121 97, 122 99, 125 99"
            stroke="#F6A2B3"
            strokeWidth="11"
            strokeLinecap="round"
          />
        </g>

        {/* === 'n' (Soft Sky Blue) === */}
        <g id="letter-n">
          <path
            d="M 142 99 L 142 66 C 142 63, 150 58, 162 58 C 174 58, 181 65, 181 74 L 181 99"
            stroke="#9FDAF0"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>

        {/* === 'd' (Soft Lavender / Lilac) === */}
        <g id="letter-d">
          {/* Bowl */}
          <circle cx="206" cy="80" r="19" stroke="#BCAAD8" strokeWidth="11" fill="none" />
          {/* Tall Ascender */}
          <path
            d="M 224 38 L 224 95 C 224 97, 225 99, 228 99"
            stroke="#BCAAD8"
            strokeWidth="11"
            strokeLinecap="round"
          />
        </g>

        {/* === 'y' (Soft Pastel Yellow) === */}
        <g id="letter-y">
          {/* Left Branch */}
          <path
            d="M 246 62 L 257 82"
            stroke="#F8DE7E"
            strokeWidth="11"
            strokeLinecap="round"
          />
          {/* Main Descender Stroke */}
          <path
            d="M 278 62 L 253 103 C 248 111, 241 115, 234 113"
            stroke="#F8DE7E"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>

        {/* === SUBTITLE: SALÓN DE EVENTOS (Tucked inward under 'andy' to avoid overlapping the 'C' wing) === */}
        {showSubtitle && (
          <text
            x="96"
            y="138"
            textAnchor="start"
            fill="#64788D"
            fontSize="16.5"
            fontWeight="800"
            letterSpacing="2"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          >
            SALÓN DE EVENTOS
          </text>
        )}
      </svg>
    </div>
  );
};
