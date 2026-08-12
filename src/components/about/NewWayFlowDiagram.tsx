'use client'

/**
 * About — “A New Way to Buy and Sell” flow diagram (light theme).
 * Packets: Sellers → AI, Buyers → AI (RTL), fork → Direct Contact.
 */

const PACKET_GREEN = '#7BC67A'
const PACKET_GLOW = '0 0 6px 1px rgba(123,198,122,0.45)'

export default function NewWayFlowDiagram({ className }: { className?: string }) {
  return (
    <div
      className={className}
      style={{
        background: '#FFFFFF',
        borderRadius: 20,
        border: '1px solid #E8E9EA',
        padding: '32px 24px 32px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
      }}
    >
      <style>{`
        @keyframes nwf-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes nwf-pkt-ltr {
          0% { left: 0; opacity: 0; }
          12% { opacity: 1; }
          88% { opacity: 1; }
          100% { left: calc(100% - 6px); opacity: 0; }
        }
        @keyframes nwf-pkt-rtl {
          0% { right: 0; left: auto; opacity: 0; }
          12% { opacity: 1; }
          88% { opacity: 1; }
          100% { right: calc(100% - 6px); left: auto; opacity: 0; }
        }
        @keyframes nwf-pkt-down {
          0% { top: 0; opacity: 0; }
          12% { opacity: 1; }
          88% { opacity: 1; }
          100% { top: calc(100% - 6px); opacity: 0; }
        }
        @keyframes nwf-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,107,53,0); }
          50% { box-shadow: 0 0 14px 0 rgba(255,107,53,0.28); }
        }
        .nwf-check {
          animation: nwf-pulse 2.4s ease-in-out infinite;
        }
        .nwf-hub {
          animation: nwf-glow 3.2s ease-in-out infinite;
        }
        .nwf-pkt-ltr {
          animation: nwf-pkt-ltr 2.6s linear infinite;
        }
        .nwf-pkt-rtl {
          animation: nwf-pkt-rtl 2.6s linear infinite;
        }
        .nwf-pkt-down {
          animation: nwf-pkt-down 2.6s linear infinite;
        }
        .nwf-pkt-delay {
          animation-delay: 1.3s;
        }
      `}</style>

      {/* Section copy — replaces former “Black Diamond Marketplace” label */}
      <div className="text-left mb-8 max-w-[720px]">
        <p className="font-mono text-[11px] font-bold text-orange uppercase tracking-[0.12em] mb-4">
          HOW IT WORKS
        </p>
        <h1
          className="font-sans text-ink"
          style={{
            margin: '0 0 12px',
            fontSize: 'clamp(36px, 6vw, 44px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
          }}
        >
          A New Way to Buy and Sell
        </h1>
        <p
          className="font-sans text-ink-2"
          style={{
            margin: 0,
            fontSize: '15px',
            fontWeight: 400,
            lineHeight: 1.7,
          }}
        >
          List it, get matched, close the deal — backed by AI verification and real people at every
          step.
        </p>
      </div>

      <div aria-hidden>
        {/* Desktop / tablet */}
        <div className="hidden sm:block">
          <div
            style={{
              position: 'relative',
              border: '1px dashed #D4D5D7',
              borderRadius: 12,
              padding: '28px 16px 24px',
              background: '#F7F8F9',
            }}
          >
            <span
              className="font-mono absolute"
              style={{
                top: -8,
                left: 16,
                padding: '0 6px',
                background: '#F7F8F9',
                fontSize: 9,
                letterSpacing: '0.12em',
                color: '#9A9DA2',
                textTransform: 'uppercase',
              }}
            >
              Verified Members
            </span>

            {/* Blocked: unverified */}
            <div className="flex flex-col items-center mb-4">
              <NodeBox title="Unverified" sub="GUESTS · NO ACCOUNT" muted />
              <div className="relative flex flex-col items-center" style={{ height: 36, width: 2 }}>
                <div style={{ flex: 1, width: 1, background: '#D4D5D7' }} />
                <BlockX />
              </div>
            </div>

            {/* Sellers → AI ← Buyers */}
            <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 md:gap-3">
              <NodeBox title="Sellers" sub="AI LISTINGS · ACCOUNT" accent />
              <FlowLine direction="ltr" packets />
              <div className="nwf-hub rounded-[10px]">
                <NodeBox title="AI Verification" sub="✓ LISTINGS · MEMBERS" hub />
              </div>
              <FlowLine direction="rtl" packets delay />
              <NodeBox title="Buyers" sub="PRODUCT PAGES · INQUIRY" accent />
            </div>

            {/* Fork: Sellers + Buyers converge into Direct Contact */}
            <div className="flex flex-col items-center mt-1">
              <ForkToContact />
              <NodeBox
                title="Direct Contact"
                sub="EMAIL · PHONE · HUMAN TO HUMAN"
                accent
                wide
              />
            </div>

            {/* Blocked: middlemen */}
            <div className="flex flex-col items-center mt-4">
              <div className="relative flex flex-col items-center" style={{ height: 36, width: 2 }}>
                <BlockX />
                <div style={{ flex: 1, width: 1, background: '#D4D5D7' }} />
              </div>
              <NodeBox title="Middlemen" sub="BROKERS · GATEKEEPERS" muted />
            </div>
          </div>
        </div>

        {/* Mobile */}
        <div className="flex sm:hidden flex-col items-stretch gap-2">
          <div className="grid grid-cols-2 gap-2">
            <NodeBox title="Sellers" sub="AI LISTINGS · ACCOUNT" accent />
            <NodeBox title="Buyers" sub="PRODUCT PAGES · INQUIRY" accent />
          </div>
          <div className="flex justify-center gap-10">
            <MobileArrow />
            <MobileArrow />
          </div>
          <div className="nwf-hub rounded-[10px]">
            <NodeBox title="AI Verification" sub="✓ LISTINGS · MEMBERS" hub />
          </div>
          <div className="flex justify-center">
            <MobileArrow />
          </div>
          <NodeBox title="Direct Contact" sub="EMAIL · PHONE · HUMAN TO HUMAN" accent />
          <p
            className="font-mono text-center"
            style={{ fontSize: 10, color: '#9A9DA2', letterSpacing: '0.08em', margin: '8px 0 0' }}
          >
            UNVERIFIED &amp; MIDDLEMEN BLOCKED
          </p>
        </div>
      </div>
    </div>
  )
}

function NodeBox({
  title,
  sub,
  muted,
  accent,
  hub,
  wide,
}: {
  title: string
  sub: string
  muted?: boolean
  accent?: boolean
  hub?: boolean
  wide?: boolean
}) {
  return (
    <div
      style={{
        background: hub ? '#FFF2ED' : muted ? '#F0F0F0' : '#FFFFFF',
        border: `1px solid ${hub ? '#FF6B35' : muted ? '#E8E9EA' : '#D4D5D7'}`,
        borderRadius: 10,
        padding: hub ? '14px 16px' : '12px 14px',
        textAlign: 'center',
        minWidth: wide ? 200 : undefined,
        width: wide ? '100%' : undefined,
        maxWidth: wide ? 320 : undefined,
      }}
    >
      <p
        className="font-sans m-0"
        style={{
          fontSize: hub ? 15 : 13,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: muted ? '#9A9DA2' : '#1A1D20',
          marginBottom: 4,
        }}
      >
        {title}
      </p>
      <p
        className="font-mono m-0"
        style={{
          fontSize: 9,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: hub || accent ? '#FF6B35' : '#9A9DA2',
        }}
      >
        {sub}
      </p>
    </div>
  )
}

function FlowLine({
  direction,
  packets,
  delay,
}: {
  direction: 'ltr' | 'rtl'
  packets?: boolean
  delay?: boolean
}) {
  const animClass =
    direction === 'ltr'
      ? `nwf-pkt-ltr${delay ? ' nwf-pkt-delay' : ''}`
      : `nwf-pkt-rtl${delay ? ' nwf-pkt-delay' : ''}`

  return (
    <div
      className="relative flex items-center"
      style={{ width: 40, height: 2, background: '#D4D5D7', flexShrink: 0 }}
    >
      {packets && (
        <span
          className={`absolute ${animClass}`}
          style={{
            top: -2,
            ...(direction === 'ltr' ? { left: 0 } : { right: 0 }),
            width: 6,
            height: 6,
            borderRadius: 1,
            background: PACKET_GREEN,
            boxShadow: PACKET_GLOW,
          }}
        />
      )}
    </div>
  )
}

function ForkToContact() {
  return (
    <div
      className="relative"
      style={{ height: 52, width: '100%', maxWidth: 280, margin: '6px 0 12px' }}
    >
      <svg
        width="100%"
        height="52"
        viewBox="0 0 280 52"
        preserveAspectRatio="none"
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Gray track */}
        <path
          d="M40 0 V20 H140 V52"
          fill="none"
          stroke="#D4D5D7"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M240 0 V20 H140 V52"
          fill="none"
          stroke="#D4D5D7"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Seller fork packet — longer path, longer duration ≈ same px/s as horizontal */}
        <g>
          <animateMotion
            dur="9.8s"
            repeatCount="indefinite"
            calcMode="linear"
            path="M40 0 V20 H140 V52"
          />
          <rect
            x="-3"
            y="-3"
            width="6"
            height="6"
            rx="1"
            fill={PACKET_GREEN}
            style={{ filter: 'drop-shadow(0 0 3px rgba(123,198,122,0.55))' }}
          />
        </g>
        {/* Buyer fork packet */}
        <g>
          <animateMotion
            dur="9.8s"
            repeatCount="indefinite"
            begin="4.9s"
            calcMode="linear"
            path="M240 0 V20 H140 V52"
          />
          <rect
            x="-3"
            y="-3"
            width="6"
            height="6"
            rx="1"
            fill={PACKET_GREEN}
            style={{ filter: 'drop-shadow(0 0 3px rgba(123,198,122,0.55))' }}
          />
        </g>
      </svg>
    </div>
  )
}

function BlockX() {
  return (
    <span
      className="font-mono"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 18,
        height: 18,
        borderRadius: 4,
        background: '#FFF2ED',
        border: '1px solid #FFD4C2',
        color: '#FF6B35',
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1,
        zIndex: 1,
      }}
    >
      ×
    </span>
  )
}

function MobileArrow() {
  return (
    <div className="flex justify-center relative" style={{ height: 28 }}>
      <div style={{ width: 2, height: '100%', background: '#D4D5D7' }} />
      <span
        className="absolute nwf-pkt-down"
        style={{
          left: '50%',
          marginLeft: -3,
          width: 6,
          height: 6,
          borderRadius: 1,
          background: PACKET_GREEN,
          boxShadow: PACKET_GLOW,
        }}
      />
    </div>
  )
}
