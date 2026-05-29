export const TRACKING_STAGE_MAP: Record<string, { progress: number; orderStatus?: string }> = {
  'Pembayaran Diterima': { progress: 10, orderStatus: 'processing' },
  'Sedang Dipersiapkan': { progress: 35, orderStatus: 'processing' },
  'Pesanan Diproses': { progress: 35, orderStatus: 'processing' },
  'Dalam Perjalanan': { progress: 70, orderStatus: 'shipped' },
  'Pesanan Dikirim': { progress: 70, orderStatus: 'shipped' },
  'Selesai': { progress: 100, orderStatus: 'completed' },
  'Diterima': { progress: 100, orderStatus: 'completed' },
  'Completed': { progress: 100, orderStatus: 'completed' },
};
