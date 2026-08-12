import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { OrderType, PaymentMethodKey } from '../data/mock';

export interface ReceiptItem {
  name: string;
  qty: number;
  unitPrice: number;
  variant: string | null;
  addons: string[];
  note: string;
}

export interface ReceiptData {
  orderId: string;
  createdAt: string;
  orderType: OrderType;
  tableNumber: number | null;
  items: ReceiptItem[];
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethodKey;
  transactionType: 'offline' | 'online';
  paidAmount?: number;
  cashierName?: string;
}

const methodLabel: Record<PaymentMethodKey, string> = {
  tunai: 'Tunai',
  qris: 'QRIS',
  transfer: 'Transfer',
  hutang: 'Hutang',
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const fmt = (n: number) => 'Rp' + n.toLocaleString('id-ID');

const pad = (s: string, width: number) => {
  if (s.length >= width) return s;
  return s + ' '.repeat(width - s.length);
};

const padLeft = (s: string, width: number) => {
  if (s.length >= width) return s;
  return ' '.repeat(width - s.length) + s;
};

export function buildReceiptHtml(receipt: ReceiptData): string {
  const date = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(receipt.createdAt));

  const orderLine = `${receipt.orderType === 'dine_in' ? 'Dine-in' : 'Takeaway'}${receipt.tableNumber ? ` (Meja ${receipt.tableNumber})` : ''}`;

  const cashierLabel = receipt.cashierName ? esc(`Kasir: ${receipt.cashierName}`) : '';

  const paidAmount = receipt.paidAmount ?? receipt.total;
  const change = Math.max(0, paidAmount - receipt.total);

  const itemLines = receipt.items
    .map((item) => {
      const lines: string[] = [];
      lines.push(
        `<div class="row"><span>${esc(pad(`${item.qty}x ${item.name}`, 34))}</span><span class="right">${esc(fmt(item.unitPrice * item.qty))}</span></div>`
      );
      if (item.variant) {
        lines.push(`<div class="meta">- ${esc(item.variant)}</div>`);
      }
      if (item.addons.length > 0) {
        lines.push(`<div class="meta">- ${esc(item.addons.join(', '))}</div>`);
      }
      if (item.note) {
        lines.push(`<div class="meta">- Catatan: ${esc(item.note)}</div>`);
      }
      return lines.join('');
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  @page { margin: 16px; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 13px;
    color: #000;
    margin: 0;
    padding: 0;
  }
  .receipt { width: 100%; }
  .center { text-align: center; }
  .brand { font-size: 17px; font-weight: bold; letter-spacing: 1px; }
  .sub { font-size: 12px; margin-top: 2px; }
  .divider {
    border-top: 1px dashed #000;
    margin: 10px 0;
  }
  .row {
    display: flex;
    justify-content: space-between;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .right { text-align: right; white-space: nowrap; }
  .meta { padding-left: 12px; font-size: 11px; margin: 2px 0 4px; }
  .info { display: flex; justify-content: space-between; font-size: 12px; margin: 2px 0; }
  .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 15px; }
  .footer { text-align: center; margin-top: 14px; font-size: 12px; }
  .muted { font-size: 10px; }
</style>
</head>
<body>
  <div class="receipt">
    <div class="center">
      <div class="brand">SAMSAM GULING BU EKA</div>
      <div class="sub">Warung Makan Babi</div>
      <div class="sub">Jl. Ismail Marzuki No. 7 Mataram</div>
    </div>
    <div class="divider"></div>
    <div class="info"><span>${esc(receipt.orderId)}</span><span>${esc(date)}</span></div>
    <div class="info"><span>${esc(orderLine)}</span><span>${cashierLabel}</span></div>
    <div class="divider"></div>
    ${itemLines}
    <div class="divider"></div>
    <div class="total-row"><span>TOTAL</span><span>${esc(fmt(receipt.total))}</span></div>
    <div class="row"><span>BAYAR (${esc(methodLabel[receipt.paymentMethod])})</span><span class="right">${esc(fmt(paidAmount))}</span></div>
    <div class="row"><span>KEMBALIAN</span><span class="right">${esc(fmt(change))}</span></div>
    <div class="center footer">
      Terima kasih atas kunjungan Anda!<br />
      <span class="muted">${esc(receipt.transactionType === 'online' ? 'Transaksi Online' : 'Transaksi Offline - Tunai')}</span>
    </div>
  </div>
</body>
</html>`;
}

export async function generateReceiptPdf(receipt: ReceiptData): Promise<string> {
  const html = buildReceiptHtml(receipt);
  const { uri } = await Print.printToFileAsync({ html, width: 302, height: 600 });
  return uri;
}

export async function shareReceiptPdf(receipt: ReceiptData): Promise<void> {
  const uri = await generateReceiptPdf(receipt);
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: `Simpan Struk ${receipt.orderId}`,
  });
}
