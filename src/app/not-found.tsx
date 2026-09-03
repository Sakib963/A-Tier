import Link from 'next/link';
import { SYSTEM } from '@/lib/copy';

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="font-display text-6xl text-turf-700/30">404</p>
      <p className="mx-auto mt-4 max-w-sm text-lg text-turf-900">
        {SYSTEM.notFound[0]}
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-full bg-turf-700 px-5 py-2.5 font-semibold text-cream transition hover:bg-turf-900"
      >
        Back to the front page
      </Link>
    </div>
  );
}
