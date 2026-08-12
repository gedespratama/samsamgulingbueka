export function formatRupiah(value: number): string {
  if (!Number.isFinite(value)) return 'Rp0';
  return 'Rp' + value.toLocaleString('id-ID');
}
