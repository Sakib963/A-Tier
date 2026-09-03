import { TAKA, takaDigits } from '@/lib/format';

/**
 * A money figure. The one hard rule from VOICE-AND-COPY section 7 is that the
 * number must be instantly clear, so:
 *   * the digits carry the weight and size, the sign is quieter and smaller;
 *   * a small gap keeps the sign from colliding with the first digit;
 *   * digits are tabular so columns of figures line up;
 *   * the sign gets its own font stack, because the taka glyph needs Bengali
 *     coverage that plain system stacks often lack.
 */
export function Taka({
  amount,
  className = '',
  signClassName = '',
}: {
  amount: number;
  className?: string;
  signClassName?: string;
}) {
  const negative = Math.round(amount) < 0;

  return (
    <span className={`tabular whitespace-nowrap ${className}`}>
      {negative ? <span aria-hidden="true">-</span> : null}
      <span className={`taka-sign ${signClassName}`} aria-hidden="true">
        {TAKA}
      </span>
      {takaDigits(amount)}
      {/* Screen readers get words, not a glyph they may not voice. */}
      <span className="sr-only">
        {negative ? 'minus ' : ''}
        {takaDigits(amount)} taka
      </span>
    </span>
  );
}
