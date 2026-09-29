import { useAnimatedNumber } from '../../utils/hooks';
import { cn } from '../../utils/cn';

/** Large currency figure that counts smoothly to new values. The "$" sits smaller, like a price in print. */
export function AnimatedAmount({ value, reduced, className, symbolClassName }: { value: number; reduced: boolean; className?: string; symbolClassName?: string }) {
  const shown = useAnimatedNumber(value, reduced);
  const text = Math.round(shown).toLocaleString('en-AU');
  return (
    <span className={cn('tabular inline-flex items-start leading-none', className)}>
      <span className={cn('mr-[0.04em] mt-[0.12em] text-[0.5em] font-medium opacity-60', symbolClassName)}>$</span>
      <span>{text}</span>
    </span>
  );
}
