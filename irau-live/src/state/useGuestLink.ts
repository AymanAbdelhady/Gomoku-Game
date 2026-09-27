import type { FundraisingEvent } from '../types';
import { useStore } from './StoreContext';
import { qrTarget } from './selectors';

/**
 * What the QR code on screen points to. With phone pledging on, it is this
 * app's guest page (with the event code pre-filled); otherwise the official
 * donation page.
 */
export function useGuestLink(event: FundraisingEvent): { url: string; pledging: boolean } {
  const store = useStore();
  if (!event.pledging.enabled) return { url: qrTarget(event), pledging: false };
  const { origin, pathname, hostname } = window.location;
  const local = /^(localhost|127\.|\[::1\])/.test(hostname);
  const base = (event.pledging.publicUrl.trim() || (local && store.publicBaseUrl()) || `${origin}${pathname}`).replace(/#.*$/, '');
  return { url: `${base}#/give?code=${encodeURIComponent(event.pledging.code)}`, pledging: true };
}
