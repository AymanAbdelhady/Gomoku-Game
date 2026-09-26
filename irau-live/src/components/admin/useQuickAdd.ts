import { useCallback, useRef, useState } from 'react';
import type { Donation, FundraisingEvent, Recognition } from '../../types';
import { useDispatch } from '../../state/StoreContext';
import { getActiveLevel } from '../../state/selectors';
import { parseAmount } from '../../utils/format';
import { uid } from '../../utils/id';

export interface QuickAddForm {
  amountText: string;
  name: string;
  recognition: Recognition;
  /** null = follow the recognition threshold automatically. */
  recogniseOverride: boolean | null;
}

const EMPTY: QuickAddForm = { amountText: '', name: '', recognition: 'name', recogniseOverride: null };

/** Form state + submit/undo for fast stage entry, shared by the form and keyboard shortcuts. */
export function useQuickAdd(event: FundraisingEvent) {
  const dispatch = useDispatch();
  const [form, setForm] = useState<QuickAddForm>(EMPTY);
  const [lastAdded, setLastAdded] = useState<Donation | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const level = getActiveLevel(event);
  const amount = parseAmount(form.amountText) ?? (form.amountText.trim() === '' && level ? level.amount : null);
  const threshold = event.display.recognitionThreshold;
  const recognise = form.recogniseOverride ?? (threshold > 0 && !!amount && amount >= threshold);
  const paused = event.status !== 'live';

  const setAmount = useCallback((n: number) => {
    setForm((f) => ({ ...f, amountText: String(n) }));
    nameRef.current?.focus();
  }, []);

  const submit = useCallback(() => {
    if (!amount || paused) return false;
    const anonymous = form.recognition === 'anonymous' || form.name.trim() === '';
    const donation: Donation = {
      id: uid('don'),
      eventId: event.id,
      donor: { name: anonymous ? '' : form.name.trim().slice(0, 60), recognition: anonymous ? 'anonymous' : form.recognition },
      amount,
      anonymous,
      nameHidden: false,
      timestamp: Date.now(),
      source: 'stage',
      ...(level && amount === level.amount ? { levelId: level.id } : {}),
    };
    dispatch({ type: 'donation/add', donation, recognise });
    setLastAdded(donation);
    // During an appeal keep the level amount so the next pledge is one keystroke away.
    setForm(EMPTY);
    (level ? nameRef : amountRef).current?.focus();
    return true;
  }, [amount, paused, form, event.id, level, recognise, dispatch]);

  const undo = useCallback(() => {
    if (!lastAdded) return;
    dispatch({ type: 'donation/remove', eventId: lastAdded.eventId, id: lastAdded.id });
    setLastAdded(null);
  }, [lastAdded, dispatch]);

  const reset = useCallback(() => {
    setForm(EMPTY);
    amountRef.current?.focus();
  }, []);

  return { form, setForm, amount, recognise, paused, level, submit, undo, reset, setAmount, lastAdded, setLastAdded, amountRef, nameRef };
}

export type QuickAddApi = ReturnType<typeof useQuickAdd>;
