import { useEffect, useId, useState, type ReactNode } from 'react';
import { Input, TextArea } from '../ui/primitives';
import { isPlaceholder } from '../../utils/content';
import { money, parseAmount } from '../../utils/format';
import { cn } from '../../utils/cn';

/**
 * Settings inputs keep a local draft and commit on blur / Enter, so typing
 * doesn't send one sync message per keystroke to every screen.
 */
function useDraft<T>(value: T) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return [draft, setDraft] as const;
}

export function TextSetting({ label, value, onCommit, hint, multiline, placeholder, flagPlaceholder, type = 'text', className }: { label: ReactNode; value: string; onCommit: (v: string) => void; hint?: ReactNode; multiline?: boolean; placeholder?: string; flagPlaceholder?: boolean; type?: string; className?: string }) {
  const id = useId();
  const [draft, setDraft] = useDraft(value);
  const commit = () => draft !== value && onCommit(draft);
  const pending = flagPlaceholder && isPlaceholder(draft);
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
        {label}
        {pending && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">To be confirmed · hidden on screen</span>}
      </label>
      {multiline ? (
        <TextArea id={id} value={draft} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)} onBlur={commit} className={cn(pending && 'ring-amber-300')} />
      ) : (
        <Input
          id={id}
          type={type}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
          className={cn(pending && 'ring-amber-300')}
        />
      )}
      {hint && <p className="mt-1.5 text-[13px] leading-snug text-slate-500">{hint}</p>}
    </div>
  );
}

export function MoneySetting({ label, value, onCommit, hint, allowZero, className }: { label: ReactNode; value: number; onCommit: (v: number) => void; hint?: ReactNode; allowZero?: boolean; className?: string }) {
  const id = useId();
  const [draft, setDraft] = useDraft(String(value));
  const parsed = draft.trim() === '0' || draft.trim() === '' ? (allowZero ? 0 : null) : parseAmount(draft);
  const invalid = parsed === null;
  const commit = () => {
    if (parsed !== null && parsed !== value) onCommit(parsed);
    else if (invalid) setDraft(String(value));
  };
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-400">$</span>
        <Input
          id={id}
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
          className={cn('tabular pl-8', invalid && 'ring-red-400')}
          aria-invalid={invalid}
        />
      </div>
      <p className="mt-1.5 text-[13px] leading-snug text-slate-500">
        {invalid ? <span className="text-red-700">Enter an amount like 300000 or 300k</span> : hint ?? (parsed ? money(parsed) : '')}
      </p>
    </div>
  );
}

export function ColourSetting({ label, value, onCommit }: { label: string; value: string; onCommit: (v: string) => void }) {
  const id = useId();
  const [draft, setDraft] = useDraft(value);
  const valid = /^#([0-9a-f]{6})$/i.test(draft);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input type="color" aria-label={`${label} picker`} value={valid ? draft : '#000000'} onChange={(e) => onCommit(e.target.value)} className="h-12 w-14 cursor-pointer rounded-xl border-0 bg-transparent p-0" />
        <Input id={id} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={() => valid && draft !== value && onCommit(draft)} className={cn('font-mono uppercase', !valid && 'ring-red-400')} />
      </div>
    </div>
  );
}
