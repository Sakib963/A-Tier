import Link from 'next/link';
import { BRAND, SYSTEM } from '@/lib/copy';

/**
 * The wordmark. The "A" does double duty as a football, per the voice deck:
 * an illustrated mark only, never a photo of a real person.
 */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-baseline gap-2 ${className}`}
    >
      <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center">
        <svg viewBox="0 0 36 36" className="h-9 w-9" aria-hidden="true">
          <circle cx="18" cy="18" r="17" className="fill-turf-700" />
          <path
            d="M18 6 L27 29 H22.5 L18 16 L13.5 29 H9 Z"
            className="fill-cream"
          />
          <path
            d="M13.2 24 H22.8"
            className="stroke-turf-700"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="font-display text-2xl tracking-tight text-turf-950">
        {BRAND.wordmark}
      </span>
    </Link>
  );
}

/**
 * The Atiar Confidence Meter. Pinned near every deadline, permanently at 100%.
 * That is the joke and it never changes.
 */
export function ConfidenceMeter({
  className = '',
  tone = 'light',
}: {
  className?: string;
  /** 'dark' for placement on the turf-green hero, where text must go light. */
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${
        dark
          ? 'border-hardhat/50 bg-hardhat/15'
          : 'border-hardhat/40 bg-hardhat/10'
      } ${className}`}
      title={`${SYSTEM.confidence}: 100%`}
    >
      <span
        className={`text-[11px] font-semibold tracking-wide uppercase ${
          dark ? 'text-hardhat' : 'text-turf-900'
        }`}
      >
        {SYSTEM.confidence}
      </span>
      <span
        className={`tabular text-sm font-bold ${
          dark ? 'text-cream' : 'text-turf-950'
        }`}
      >
        100%
      </span>
    </div>
  );
}

/** The "under 2 days" stamp, for timelines and countdowns. */
export function TwoDaysStamp({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block -rotate-6 rounded border-2 border-owed/70 px-2 py-0.5 text-[10px] font-black tracking-widest text-owed/80 uppercase ${className}`}
    >
      ≤ 2 days
    </span>
  );
}
