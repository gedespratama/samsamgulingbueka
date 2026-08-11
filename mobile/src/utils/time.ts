export function timeAgo(iso: string): string {
  const diffMs = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins} menit yang lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  return `${Math.floor(hours / 24)} hari yang lalu`;
}
