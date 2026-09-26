import type { FormEvent } from 'react';
import type { FundraisingEvent, Recognition } from '../../types';
import type { QuickAddApi } from './useQuickAdd';
import { enabledLevels } from '../../state/selectors';
import { money } from '../../utils/format';
import { publicDonorName } from '../../utils/content';
import { Button, Card, Input, Kbd, Segmented } from '../ui/primitives';
import { Icon } from '../ui/Icon';
import { cn } from '../../utils/cn';

const FALLBACK_PRESETS = [10_000, 5_000, 2_500, 1_000, 500, 250, 100, 50];

export function QuickAddPanel({ event, api }: { event: FundraisingEvent; api: QuickAddApi }) {
  const { form, setForm, amount, recognise, paused, level, submit, undo, lastAdded, setLastAdded, amountRef, nameRef, setAmount } = api;
  const levels = enabledLevels(event).map((l) => l.amount);
  const presets = (levels.length ? levels : FALLBACK_PRESETS).slice(0, 8);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  return (
    <Card
      eyebrow="Stage entry"
      title="Quick add donation"
      actions={
        <span className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
          Type amount, press <kbd className="rounded-md bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700 ring-1 ring-slate-200">Enter</kbd>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" aria-describedby={paused ? 'paused-note' : undefined}>
        {level && (
          <div className="flex items-center gap-3 rounded-2xl bg-brand/10 px-4 py-3 text-[15px] text-navy">
            <Icon name="megaphone" className="h-5 w-5 shrink-0 text-brand" />
            <span>
              Appeal at <strong className="tabular">{money(level.amount)}</strong> — leave the amount blank and press Enter for each pledge.
            </span>
          </div>
        )}

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-700">Amount</legend>
          <div className="grid grid-cols-4 gap-2">
            {presets.map((p, i) => {
              const selected = amount === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p)}
                  aria-pressed={selected}
                  className={cn(
                    'tabular relative h-16 rounded-2xl text-lg font-bold transition sm:text-xl',
                    selected ? 'bg-navy text-white shadow-lg shadow-navy/25' : 'bg-slate-50 text-navy ring-1 ring-inset ring-slate-200 hover:bg-white hover:ring-brand/50',
                  )}
                >
                  {money(p)}
                  <span className={cn('absolute right-2 top-1.5 hidden text-[10px] font-semibold lg:block', selected ? 'text-white/50' : 'text-slate-400')}>Alt {i + 1}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <label htmlFor="qa-amount" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Custom amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-slate-400">$</span>
              <Input
                id="qa-amount"
                ref={amountRef}
                autoFocus
                inputMode="decimal"
                autoComplete="off"
                placeholder={level ? String(level.amount) : '5000 or 5k'}
                value={form.amountText}
                onChange={(e) => setForm({ ...form, amountText: e.target.value })}
                className="tabular h-16 pl-9 text-2xl font-semibold"
                aria-describedby="qa-amount-read"
              />
            </div>
            <p id="qa-amount-read" className="mt-1.5 h-5 text-[13px] text-slate-500" aria-live="polite">
              {form.amountText && !amount ? <span className="text-red-700">Enter a number, e.g. 2500 or 2.5k</span> : amount ? <>Will add <strong className="tabular text-slate-800">{money(amount)}</strong></> : ''}
            </p>
          </div>
          <div>
            <label htmlFor="qa-name" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Donor name <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <Input
              id="qa-name"
              ref={nameRef}
              autoComplete="off"
              placeholder="First name, e.g. Ahmed"
              value={form.name}
              maxLength={60}
              disabled={form.recognition === 'anonymous'}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-16 text-lg"
              aria-describedby="qa-name-help"
            />
            <p id="qa-name-help" className="mt-1.5 text-[13px] text-slate-500">
              Name only — never emails, phone numbers or card details.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr] sm:items-end">
          <div>
            <p className="mb-1.5 text-sm font-semibold text-slate-700">Show on screen as</p>
            <Segmented<Recognition>
              label="Show donor on screen as"
              size="lg"
              value={form.recognition}
              onChange={(v) => setForm({ ...form, recognition: v })}
              options={[
                { value: 'name', label: form.name.trim() || 'Name' },
                { value: 'family', label: '& Family' },
                { value: 'anonymous', label: 'Anonymous' },
              ]}
            />
          </div>
          <label className="flex h-12 cursor-pointer items-center gap-3 rounded-xl bg-slate-50 px-4 ring-1 ring-inset ring-slate-200">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[var(--color-brand)]"
              checked={recognise}
              onChange={(e) => setForm({ ...form, recogniseOverride: e.target.checked })}
            />
            <span className="text-[15px] font-semibold text-slate-700">Thank-you on screen</span>
          </label>
        </div>

        <Button type="submit" variant="primary" size="xl" className="w-full" disabled={!amount || paused}>
          <Icon name="plus" className="h-6 w-6" />
          {amount ? `Add ${money(amount)}` : 'Add donation'}
          <span className="ml-2 hidden sm:inline">
            <Kbd>Enter ↵</Kbd>
          </span>
        </Button>

        {paused && (
          <p id="paused-note" className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            Donations are paused. Resume from the Live/Paused switch at the top (Alt+P).
          </p>
        )}

        {lastAdded && (
          <div role="status" className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-[15px] text-emerald-900 ring-1 ring-emerald-200">
            <span className="flex min-w-0 items-center gap-2">
              <Icon name="check" className="h-5 w-5 shrink-0" />
              <span className="truncate">
                Added <strong className="tabular">{money(lastAdded.amount)}</strong> · {publicDonorName(lastAdded)}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <Button size="sm" variant="ghost" onClick={undo} title="Ctrl+Z / ⌘Z">
                <Icon name="undo" className="h-4 w-4" /> Undo
              </Button>
              <button className="grid h-8 w-8 place-items-center rounded-lg text-emerald-700 hover:bg-emerald-100" aria-label="Dismiss" onClick={() => setLastAdded(null)}>
                <Icon name="x" className="h-4 w-4" />
              </button>
            </span>
          </div>
        )}
      </form>
    </Card>
  );
}
