'use client';

import { SYSTEM } from '@/lib/copy';

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="py-16 text-center">
      <p className="font-display text-4xl text-turf-950">Hold on.</p>
      <p className="mx-auto mt-4 max-w-md text-lg text-turf-900">
        {SYSTEM.error}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-full bg-turf-700 px-5 py-2.5 font-semibold text-cream transition hover:bg-turf-900"
      >
        Try again
      </button>
    </div>
  );
}
