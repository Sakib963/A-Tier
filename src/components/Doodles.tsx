// The fun layer: decorative SVG shapes, motifs and stamps.
//
// Everything here is pure decoration, so it all carries aria-hidden and sits
// BEHIND content, never over a money figure. VOICE-AND-COPY section 7: the
// number is always unmissable, so shapes decorate the ground, not the digits.

/** Big soft blob. Organic counterweight to all the straight edges. */
export function Blob({
  className = '',
  variant = 1,
}: {
  className?: string;
  variant?: 1 | 2 | 3;
}) {
  const paths = {
    1: 'M52 8c22 4 40 18 44 40 4 22-8 44-28 54s-46 6-62-10S-6 52 6 32 30 4 52 8z',
    2: 'M56 4c26 8 44 30 40 56s-26 44-52 40S2 74 6 46 30-4 56 4z',
    3: 'M48 6c24 0 46 14 50 38s-10 48-34 54-52-6-60-28 4-50 22-58c8-4 14-6 22-6z',
  };

  return (
    <svg
      viewBox="0 0 104 104"
      className={`pointer-events-none absolute ${className}`}
      aria-hidden="true"
    >
      <path d={paths[variant]} />
    </svg>
  );
}

/** Scattered confetti dots. Seeded, so server and client agree. */
export function Dots({
  className = '',
  count = 18,
  seed = 7,
}: {
  className?: string;
  count?: number;
  seed?: number;
}) {
  const dots = Array.from({ length: count }, (_, i) => {
    const n = (i + 1) * seed;
    return {
      cx: (n * 37) % 100,
      cy: (n * 61) % 100,
      r: 0.7 + ((n * 13) % 10) / 8,
    };
  });

  return (
    <svg
      viewBox="0 0 100 100"
      className={`pointer-events-none absolute ${className}`}
      aria-hidden="true"
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} />
      ))}
    </svg>
  );
}

/** Pitch markings: centre circle and halfway line. */
export function PitchLines({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 120"
      className={`pointer-events-none absolute ${className}`}
      fill="none"
      aria-hidden="true"
    >
      <circle cx="100" cy="60" r="30" strokeWidth="1.5" />
      <path d="M100 0v120" strokeWidth="1.5" />
      <path d="M0 20h30v80H0M200 20h-30v80h30" strokeWidth="1.5" />
    </svg>
  );
}

/** Concentric arcs, like a radar sweep of pure confidence. */
export function Arcs({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`pointer-events-none absolute ${className}`}
      fill="none"
      aria-hidden="true"
    >
      {[24, 38, 52, 66].map((r) => (
        <circle key={r} cx="0" cy="100" r={r} strokeWidth="2" />
      ))}
    </svg>
  );
}

/** Zigzag, for energy along an edge. */
export function Zigzag({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 12"
      className={`pointer-events-none absolute ${className}`}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M0 9l10-6 10 6 10-6 10 6 10-6 10 6 10-6 10 6 10-6 10 6 10-6 10 6"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** The wrench: fixes anything, including the water pump. */
export function Wrench({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14.7 6.3a4.5 4.5 0 105.99 5.99l-2.83-2.83 1.06-1.06-3.16-.06-.06-3.16-1.06 1.06-2.83-2.83a4.5 4.5 0 002.89 2.89z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M13.5 10.5L4 20a2 2 0 002.83 2.83l9.5-9.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Hard hat: extends the office building. */
export function HardHat({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M3 17h18a9 9 0 00-5-8.06V5a1 1 0 00-1-1h-6a1 1 0 00-1 1v3.94A9 9 0 003 17z"
        fill="currentColor"
      />
      <rect x="1.5" y="17" width="21" height="3" rx="1.5" fill="currentColor" />
    </svg>
  );
}

/**
 * Football. Kept deliberately simple: one centre pentagon and three edge
 * patches read as a ball even at 20px, where finer seam lines turn to mush.
 */
export function Football({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10.5" fill="currentColor" />
      <g fill="var(--color-cream)">
        {/* centre pentagon */}
        <path d="M12 6.6l4 2.9-1.5 4.7h-5L8 9.5z" />
        {/* three edge patches */}
        <path d="M12 1.6l2.6 1.9-2.6.9-2.6-.9z" />
        <path d="M2.4 9.9l2.2-1.6 1.1 2.5-1.6 2.1z" />
        <path d="M21.6 9.9l-2.2-1.6-1.1 2.5 1.6 2.1z" />
        <path d="M7.4 21.1l1-2.4 2.4.9-.4 2.7z" />
        <path d="M16.6 21.1l-1-2.4-2.4.9.4 2.7z" />
      </g>
    </svg>
  );
}

/** The YES stamp. Atiar bhai already said yes. */
export function YesStamp({ className = '' }: { className?: string }) {
  return (
    <div
      className={`inline-flex -rotate-12 items-center justify-center rounded-lg border-[3px] border-turf-700/70 px-3 py-1 ${className}`}
      aria-hidden="true"
    >
      <span className="font-display text-lg tracking-widest text-turf-700/80">
        YES
      </span>
    </div>
  );
}

/**
 * The mascot: the can-do-anything silhouette. Jersey, wrench in one hand,
 * laptop in the other. Illustration only, never a photo of a real person.
 */
export function Mascot({ className = '' }: { className?: string }) {
  const SKIN = '#c68642';

  return (
    <svg viewBox="0 0 150 170" className={className} aria-hidden="true">
      {/* ------------------------------------------------------------ legs */}
      <path
        d="M64 128v22M86 128v22"
        stroke={SKIN}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M56 150h17a2 2 0 012 2v4H56zM77 150h17a2 2 0 012 2v4H77z"
        className="fill-turf-950"
      />

      {/* --------------------------------------------------------- shorts */}
      <path d="M58 112h34l-2 18H60z" className="fill-turf-950" />

      {/* --------------------------------------------------------- jersey */}
      <path d="M56 72q19-9 38 0l5 42q-24 6-48 0z" className="fill-turf-500" />
      <path
        d="M66 70q9 9 18 0"
        fill="none"
        stroke="var(--color-cream)"
        strokeWidth="3"
      />
      <text
        x="75"
        y="102"
        textAnchor="middle"
        className="fill-cream font-display"
        style={{ fontSize: '22px' }}
      >
        A
      </text>

      {/* ------------------------------- left arm: raised, holding a wrench */}
      {/* Bent at the elbow so it reads as a pose, not a scarecrow. */}
      <path
        d="M57 78q-14 4-18 -6"
        fill="none"
        stroke={SKIN}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <g transform="translate(20 52) rotate(-38)">
        <rect x="0" y="5" width="20" height="5" rx="2.5" className="fill-turf-950" />
        <circle cx="21" cy="7.5" r="6" className="fill-turf-950" />
        <circle cx="23" cy="7.5" r="2.8" className="fill-cream" />
      </g>

      {/* ------------------------------ right arm: cradling a laptop, typing */}
      <path
        d="M93 78q15 6 16 18"
        fill="none"
        stroke={SKIN}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <g transform="translate(100 96) rotate(-8)">
        <rect x="0" y="0" width="30" height="19" rx="2.5" className="fill-turf-950" />
        <rect x="2.5" y="2.5" width="25" height="14" rx="1.5" className="fill-turf-100" />
        <rect x="-3" y="19" width="36" height="4" rx="2" className="fill-turf-950" />
      </g>

      {/* ----------------------------------------------------------- head */}
      <circle cx="75" cy="55" r="15" fill={SKIN} />
      {/* eyes and a permanent grin: he is always up for it */}
      <circle cx="69.5" cy="53" r="1.9" className="fill-turf-950" />
      <circle cx="80.5" cy="53" r="1.9" className="fill-turf-950" />
      <path
        d="M68.5 60q6.5 6 13 0"
        fill="none"
        stroke="#7a4a1e"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* ------------------------------------------------------- hard hat */}
      <path
        d="M52 40h46a23 23 0 00-13-20.6V15a2.5 2.5 0 00-2.5-2.5h-15A2.5 2.5 0 0065 15v4.4A23 23 0 0052 40z"
        className="fill-hardhat"
      />
      <rect x="47" y="40" width="56" height="7.5" rx="3.75" className="fill-hardhat" />
      {/* brim shadow, to lift the hat off the face */}
      <rect x="47" y="45" width="56" height="2.5" rx="1.25" fill="#00000018" />
    </svg>
  );
}
