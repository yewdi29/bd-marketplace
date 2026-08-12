'use client'

/**
 * Why We Exist — animated icon.
 * Theme: fragmented listings coalesce into a verified, connected marketplace signal.
 * Colors: brand orange + gray tokens only.
 */

export default function WhyWeExistIcon({ className }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden
      style={{ width: '100%', maxWidth: 320, aspectRatio: '1 / 1' }}
    >
      <style>{`
        @keyframes wwe-float-a {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(4px, -6px); }
        }
        @keyframes wwe-float-b {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-5px, 4px); }
        }
        @keyframes wwe-float-c {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(3px, 5px); }
        }
        @keyframes wwe-pulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.06); }
        }
        @keyframes wwe-draw {
          0% { stroke-dashoffset: 120; opacity: 0.2; }
          40% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0.9; }
        }
        @keyframes wwe-lock {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        .wwe-float-a { animation: wwe-float-a 4.5s ease-in-out infinite; }
        .wwe-float-b { animation: wwe-float-b 5.2s ease-in-out infinite; }
        .wwe-float-c { animation: wwe-float-c 3.8s ease-in-out infinite; }
        .wwe-pulse { animation: wwe-pulse 2.8s ease-in-out infinite; transform-origin: center; }
        .wwe-draw {
          stroke-dasharray: 120;
          animation: wwe-draw 3.2s ease-in-out infinite;
        }
        .wwe-lock { animation: wwe-lock 2.4s ease-in-out infinite; transform-origin: center; }
      `}</style>

      <svg
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        {/* Soft gray field ring */}
        <circle
          className="wwe-pulse"
          cx="120"
          cy="120"
          r="88"
          stroke="#E8E9EA"
          strokeWidth="1.5"
        />
        <circle
          cx="120"
          cy="120"
          r="58"
          stroke="#D4D5D7"
          strokeWidth="1"
          strokeDasharray="4 6"
          opacity="0.8"
        />

        {/* Fragmented listing cards (gray) */}
        <g className="wwe-float-a">
          <rect x="38" y="52" width="42" height="30" rx="6" fill="#F7F8F9" stroke="#D4D5D7" strokeWidth="1.5" />
          <rect x="44" y="60" width="22" height="3" rx="1.5" fill="#D4D5D7" />
          <rect x="44" y="68" width="16" height="3" rx="1.5" fill="#E8E9EA" />
        </g>
        <g className="wwe-float-b">
          <rect x="168" y="46" width="38" height="28" rx="6" fill="#F7F8F9" stroke="#D4D5D7" strokeWidth="1.5" />
          <rect x="174" y="54" width="18" height="3" rx="1.5" fill="#D4D5D7" />
          <rect x="174" y="61" width="14" height="3" rx="1.5" fill="#E8E9EA" />
        </g>
        <g className="wwe-float-c">
          <rect x="172" y="158" width="40" height="30" rx="6" fill="#F7F8F9" stroke="#D4D5D7" strokeWidth="1.5" />
          <rect x="178" y="166" width="20" height="3" rx="1.5" fill="#D4D5D7" />
          <rect x="178" y="174" width="14" height="3" rx="1.5" fill="#E8E9EA" />
        </g>
        <g className="wwe-float-a" style={{ animationDelay: '-1.4s' }}>
          <rect x="34" y="150" width="40" height="28" rx="6" fill="#F7F8F9" stroke="#D4D5D7" strokeWidth="1.5" />
          <rect x="40" y="158" width="20" height="3" rx="1.5" fill="#D4D5D7" />
          <rect x="40" y="165" width="12" height="3" rx="1.5" fill="#E8E9EA" />
        </g>

        {/* Connection lines — orange draw */}
        <path
          className="wwe-draw"
          d="M80 72 L108 108"
          stroke="#FF6B35"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ animationDelay: '0s' }}
        />
        <path
          className="wwe-draw"
          d="M178 68 L132 108"
          stroke="#FF6B35"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ animationDelay: '0.35s' }}
        />
        <path
          className="wwe-draw"
          d="M180 168 L132 132"
          stroke="#FF6B35"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ animationDelay: '0.7s' }}
        />
        <path
          className="wwe-draw"
          d="M74 164 L108 132"
          stroke="#FF6B35"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ animationDelay: '1.05s' }}
        />

        {/* Central verified node */}
        <g className="wwe-lock">
          <circle cx="120" cy="120" r="28" fill="#FFF2ED" stroke="#FFD4C2" strokeWidth="1.5" />
          <circle cx="120" cy="120" r="18" fill="#FF6B35" />
          {/* Check mark */}
          <path
            d="M111 120.5 L117 126.5 L130 113"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Outer orange accent dots */}
        <circle cx="120" cy="32" r="3.5" fill="#FF6B35" opacity="0.9" />
        <circle cx="208" cy="120" r="3" fill="#9A9DA2" />
        <circle cx="120" cy="208" r="3" fill="#9A9DA2" />
        <circle cx="32" cy="120" r="3.5" fill="#FF6B35" opacity="0.7" />
      </svg>
    </div>
  )
}
