import { SYSTEM } from '@/lib/copy';

export default function Loading() {
  return (
    <div className="py-24 text-center">
      <p className="text-lg text-turf-700">{SYSTEM.loaders[0]}</p>
    </div>
  );
}
