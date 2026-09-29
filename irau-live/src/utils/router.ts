import { useSyncExternalStore } from 'react';

/**
 * Minimal hash router. Hash routes need no server rewrites, so the build runs
 * from any static host, a file share, or the bundled sync server unchanged.
 */
export type Route = '/' | '/live' | '/admin' | '/admin/settings' | '/give';

function read(): string {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  return hash.split('?')[0];
}

export function useRoute(): string {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('hashchange', cb);
      return () => window.removeEventListener('hashchange', cb);
    },
    read,
  );
}

export function navigate(to: Route) {
  window.location.hash = to;
}

export function routeHref(to: Route): string {
  return `#${to}`;
}

/** Absolute URL of a route on this deployment (for "open display" windows). */
export function absoluteRoute(to: Route): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#${to}`;
}

/** Query parameters after the hash route, e.g. `#/give?code=4821`. */
export function hashQuery(): URLSearchParams {
  const hash = window.location.hash;
  const i = hash.indexOf('?');
  return new URLSearchParams(i >= 0 ? hash.slice(i + 1) : '');
}
