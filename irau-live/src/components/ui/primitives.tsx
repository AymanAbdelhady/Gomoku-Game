import { forwardRef, useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark' | 'gold';
type Size = 'sm' | 'md' | 'lg' | 'xl';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-white shadow-[0_10px_30px_-12px_var(--color-brand)] hover:bg-[color-mix(in_oklab,var(--color-brand)_88%,black)] active:translate-y-px',
  secondary: 'bg-white text-navy ring-1 ring-inset ring-slate-300 hover:bg-slate-50 hover:ring-slate-400',
  ghost: 'text-navy hover:bg-navy/5',
  danger: 'bg-white text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-50',
  dark: 'bg-navy text-white hover:bg-[color-mix(in_oklab,var(--color-navy)_85%,black)]',
  gold: 'bg-gold text-[#1d1403] hover:brightness-105',
};
const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-lg gap-1.5',
  md: 'h-11 px-5 text-[15px] rounded-xl gap-2',
  lg: 'h-14 px-6 text-base rounded-xl gap-2.5',
  xl: 'h-[72px] px-8 text-xl rounded-2xl gap-3',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = 'secondary', size = 'md', className, type = 'button', ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn('inline-flex select-none items-center justify-center font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45', VARIANTS[variant], SIZES[size], className)}
      {...rest}
    />
  );
});

export function Card({ title, eyebrow, actions, children, className, bodyClassName, id }: { title?: ReactNode; eyebrow?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string; id?: string }) {
  const headingId = useId();
  return (
    <section id={id} aria-labelledby={title ? headingId : undefined} className={cn('rounded-3xl bg-white shadow-[0_1px_2px_rgba(16,24,40,.05),0_8px_24px_-12px_rgba(16,24,40,.12)] ring-1 ring-slate-200/70', className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 px-6 pb-2 pt-5">
          <div>
            {eyebrow && <p className="eyebrow text-[11px] text-slate-500">{eyebrow}</p>}
            {title && (
              <h2 id={headingId} className="text-[17px] font-semibold text-slate-ink">
                {title}
              </h2>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn('px-6 pb-6 pt-3', bodyClassName)}>{children}</div>
    </section>
  );
}

export function Field({ label, hint, children, className }: { label: ReactNode; hint?: ReactNode; children: (id: string) => ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children(id)}
      {hint && <p className="mt-1.5 text-[13px] leading-snug text-slate-500">{hint}</p>}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={cn('h-12 w-full rounded-xl border-0 bg-white px-4 text-base text-slate-ink ring-1 ring-inset ring-slate-300 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-slate-50', className)}
      {...rest}
    />
  );
});

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn('min-h-[96px] w-full rounded-xl border-0 bg-white px-4 py-3 text-base leading-relaxed text-slate-ink ring-1 ring-inset ring-slate-300 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand', className)}
      {...rest}
    />
  );
}

export function Toggle({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-[15px] font-semibold text-slate-800">
          {label}
        </label>
        {description && <p className="mt-0.5 text-[13px] leading-snug text-slate-500">{description}</p>}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-40', checked ? 'bg-brand' : 'bg-slate-300')}
      >
        <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-6' : 'translate-x-1')} />
      </button>
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label, size = 'md' }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; label: string; size?: 'md' | 'lg' }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn('rounded-lg font-semibold transition', size === 'lg' ? 'h-12 text-[15px]' : 'h-9 text-sm', value === o.value ? 'bg-white text-navy shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Badge({ children, tone = 'slate', className }: { children: ReactNode; tone?: 'slate' | 'blue' | 'green' | 'amber' | 'gold' | 'red'; className?: string }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-brand/10 text-brand',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-800',
    gold: 'bg-gold/15 text-[#7a5d1f]',
    red: 'bg-red-50 text-red-700',
  };
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone], className)}>{children}</span>;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded-md bg-white/15 px-1.5 py-0.5 font-sans text-[11px] font-semibold ring-1 ring-inset ring-current/20">{children}</kbd>;
}

/** Accessible modal built on the native <dialog> element (focus trap + Esc for free). */
export function Dialog({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(560px,calc(100vw-32px))] rounded-3xl p-0 text-slate-ink shadow-2xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm"
    >
      <div className="p-7">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="mt-4">{children}</div>
        {footer && <div className="mt-7 flex justify-end gap-3">{footer}</div>}
      </div>
    </dialog>
  );
}
