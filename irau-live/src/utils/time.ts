/** "Just now", "12 seconds ago", "4 min ago", "2 hr ago". */
export function timeAgo(timestamp: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - timestamp) / 1000));
  if (s < 8) return 'Just now';
  if (s < 60) return `${s} seconds ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return new Date(timestamp).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

export function clockTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
}
