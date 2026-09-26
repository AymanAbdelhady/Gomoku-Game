import { useEffect } from 'react';
import type { FundraisingEvent } from '../../types';
import type { QuickAddApi } from './useQuickAdd';
import { useDispatch } from '../../state/StoreContext';
import { enabledLevels } from '../../state/selectors';
import { SLIDE_ORDER } from '../../config/campaign';

export const SHORTCUTS: [string, string][] = [
  ['Enter', 'Add the donation'],
  ['Alt + 1…8', 'Choose a preset amount'],
  ['Alt + A', 'Toggle anonymous'],
  ['Esc', 'Clear the form'],
  ['Ctrl/⌘ + Z', 'Undo the last donation (outside text fields)'],
  ['Alt + Shift + 1…7', 'Show slide: main, impact, levels, donors, QR, thank you, milestone'],
  ['Alt + L', 'End the current appeal'],
  ['Alt + P', 'Pause / resume donations'],
  ['?', 'Show these shortcuts'],
];

/** Operator keyboard shortcuts. Uses event.code so they work on any keyboard layout. */
export function useShortcuts(event: FundraisingEvent, qa: QuickAddApi, openHelp: () => void) {
  const dispatch = useDispatch();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;
      const digit = /^Digit([1-9])$/.exec(e.code)?.[1];

      if (e.altKey && e.shiftKey && digit) {
        const slide = SLIDE_ORDER[Number(digit) - 1];
        if (slide) {
          e.preventDefault();
          dispatch({ type: 'live/slide', eventId: event.id, slide });
        }
        return;
      }
      if (e.altKey && !e.shiftKey && digit) {
        const amount = enabledLevels(event)[Number(digit) - 1]?.amount;
        if (amount) {
          e.preventDefault();
          qa.setAmount(amount);
        }
        return;
      }
      if (e.altKey && e.code === 'KeyA') {
        e.preventDefault();
        qa.setForm((f) => ({ ...f, recognition: f.recognition === 'anonymous' ? 'name' : 'anonymous' }));
        return;
      }
      if (e.altKey && e.code === 'KeyL') {
        e.preventDefault();
        dispatch({ type: 'live/level', eventId: event.id, levelId: null });
        return;
      }
      if (e.altKey && e.code === 'KeyP') {
        e.preventDefault();
        dispatch({ type: 'event/status', eventId: event.id, status: event.status === 'live' ? 'paused' : 'live' });
        return;
      }
      if (e.key === 'Escape' && typing && target.closest('form')) {
        qa.reset();
        return;
      }
      if (!typing && (e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
        e.preventDefault();
        qa.undo();
        return;
      }
      if (!typing && e.key === '?') {
        e.preventDefault();
        openHelp();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [event, qa, dispatch, openHelp]);
}
