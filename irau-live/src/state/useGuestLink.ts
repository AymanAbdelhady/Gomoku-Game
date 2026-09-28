import type { FundraisingEvent } from '../types';
import { useStore } from './StoreContext';

/**
 * Where the QR code on screen points: this app's guest pledge page, with the
 * event code pre-filled. Phones need an address they can reach, so on
 * "localhost" the venue server's network address is used when known.
 */
export function useGuestLink(event: FundraisingEvent): { url: string } {
  const store = useStore();
  const { origin, pathname, hostname } = window.location;
  const local = /^(localhost|127\.|\[::1\])/.test(hostname);
  const base = (event.pledging.publicUrl.trim() || (local && store.publicBaseUrl()) || `${origin}${pathname}`).replace(/#.*$/, '');
  return { url: `${base}#/give?code=${encodeURIComponent(event.pledging.code)}` };
}
