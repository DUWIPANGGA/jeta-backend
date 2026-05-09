import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { ProductSalesQueryDto } from './dto/product-sales-query.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== PUBLIC METHOD ====================
  async getProductSalesReport(query: ProductSalesQueryDto, userRoleId: number) {
    // Hanya admin (role_id = 1) yang boleh akses
    if (userRoleId !== 1) {
      throw new ForbiddenException('Access denied. Only admin can view reports.');
    }

    // 1. Bangun filter waktu
    const dateFilter = this.buildDateFilter(query);

    // 2. Ambil data order items dengan filter status yang benar
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          ...(query.status !== 'all' && query.status ? { status: query.status as any } : {}),
          created_at: dateFilter,
        },
      },
      include: {
        product: true,
        variant: true,
        order: true,
      },
    });

    if (!orderItems.length) {
      return this.emptyReport(query);
    }

    // 3. Group by (pastikan ada default)
    const groupBy = query.groupBy ?? 'product';
    const aggregated = this.aggregateItems(orderItems, groupBy);

    // 4. Statistik
    const includeStats = query.includeStats === 'true';
    const statistics = includeStats ? this.calculateStatistics(aggregated.map(a => a.quantity)) : null;

    // 5. Top & Bottom
    const sortByField = (query.sortBy === 'revenue' ? 'revenue' : 'quantity') as 'quantity' | 'revenue';
    const limit = query.limit ?? 5;
    const topItems = [...aggregated].sort((a, b) => b[sortByField] - a[sortByField]).slice(0, limit);
    const bottomItems = [...aggregated].sort((a, b) => a[sortByField] - b[sortByField]).slice(0, limit);

    // 6. Total keseluruhan
    const totalUnitsSold = aggregated.reduce((sum, i) => sum + i.quantity, 0);
    const totalRevenue = aggregated.reduce((sum, i) => sum + i.revenue, 0);
    const totalOrders = new Set(orderItems.map(i => i.order_id)).size;

    const meta = {
      period: this.formatPeriod(query, dateFilter),
      status: query.status === 'all' ? 'all' : (query.status ?? 'completed'),
      groupBy,
      totalOrders,
      totalUnitsSold,
      totalRevenue,
    };

    const details = aggregated.map(item => ({
      ...item,
      percentage: totalUnitsSold ? Number(((item.quantity / totalUnitsSold) * 100).toFixed(2)) : 0,
    }));

    const enrichItems = (items: any[]) => items.map(item => ({
      ...item,
      percentage: totalUnitsSold ? Number(((item.quantity / totalUnitsSold) * 100).toFixed(2)) : 0,
    }));

    return {
      meta,
      statistics,
      topItems: enrichItems(topItems),
      bottomItems: enrichItems(bottomItems),
      details,
    };
  }

  async exportProductSalesReport(query: ProductSalesQueryDto, userRoleId: number) {
    const reportData = await this.getProductSalesReport(query, userRoleId);
    return this.generateExcel(reportData, query);
  }

  // ==================== PRIVATE HELPERS ====================

  private buildDateFilter(query: ProductSalesQueryDto) {
    if (query.startDate && query.endDate) {
      return {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      };
    }
    if (query.year && query.month) {
      const start = new Date(query.year, query.month - 1, 1);
      const end = new Date(query.year, query.month, 0, 23, 59, 59);
      return { gte: start, lte: end };
    }
    if (query.year) {
      const start = new Date(query.year, 0, 1);
      const end = new Date(query.year, 11, 31, 23, 59, 59);
      return { gte: start, lte: end };
    }
    return undefined;
  }

  private formatPeriod(query: ProductSalesQueryDto, dateFilter: any): string {
    if (query.startDate && query.endDate) return `${query.startDate} to ${query.endDate}`;
    if (query.year && query.month) return `${query.year}-${query.month.toString().padStart(2, '0')}`;
    if (query.year) return `${query.year}`;
    return 'All time';
  }

  private aggregateItems(orderItems: any[], groupBy: string) {
  const map = new Map();
  for (const item of orderItems) {
    const key = groupBy === 'product' ? item.product_id : item.variant_id;
    if (!key) continue;
    if (!map.has(key)) {
      let name = '';
      let productName = '';
      let variantName: string | null = null;
      if (groupBy === 'product') {
        name = item.product.name;
        productName = item.product.name;
      } else {
        productName = item.product.name;
        if (item.variant) {
          variantName = `${item.variant.size || ''} ${item.variant.color || ''}`.trim();
          if (variantName === '') variantName = 'Variant';
          name = `${productName} - ${variantName}`;
        } else {
          variantName = null;
          name = productName;
        }
      }
      map.set(key, {
        id: key,
        name,
        productName,
        variantName,
        quantity: 0,
        revenue: 0,
        orders: new Set(),
      });
    }
    const entry = map.get(key);
    entry.quantity += item.quantity;
    entry.revenue += (item.price ?? item.product.price) * item.quantity;
    entry.orders.add(item.order_id);
  }
  const result = Array.from(map.values()).map(entry => ({
    id: entry.id,
    name: entry.name,
    productName: entry.productName,
    variantName: entry.variantName,
    quantity: entry.quantity,
    revenue: entry.revenue,
    orderCount: entry.orders.size,
  }));
  return result;
}

  private calculateStatistics(values: number[]) {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const median = sorted.length % 2 === 0 
      ? (sorted[sorted.length/2 - 1] + sorted[sorted.length/2]) / 2 
      : sorted[Math.floor(sorted.length/2)];
    const freq: Record<number, number> = {};
    values.forEach(v => freq[v] = (freq[v] || 0) + 1);
    let maxFreq = 0;
    let modes: number[] = [];
    for (const [val, count] of Object.entries(freq)) {
      if (count > maxFreq) {
        maxFreq = count;
        modes = [Number(val)];
      } else if (count === maxFreq && maxFreq > 1) {
        modes.push(Number(val));
      }
    }
    const modus = maxFreq > 1 ? modes : [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return { mean, median, modus, min, max, stdDev };
  }

  private async generateExcel(reportData: any, query: ProductSalesQueryDto) {
    const workbook = new ExcelJS.Workbook();
    const meta = reportData.meta;

    // Sheet 1: Rangkuman
    const summarySheet = workbook.addWorksheet('Rangkuman');
    summarySheet.columns = [
      { header: 'Info', key: 'info', width: 30 },
      { header: 'Nilai', key: 'value', width: 30 },
    ];
    summarySheet.addRow({ info: 'Periode', value: meta.period });
    summarySheet.addRow({ info: 'Status Order', value: meta.status });
    summarySheet.addRow({ info: 'Group By', value: meta.groupBy });
    summarySheet.addRow({ info: 'Total Order', value: meta.totalOrders });
    summarySheet.addRow({ info: 'Total Unit Terjual', value: meta.totalUnitsSold });
    summarySheet.addRow({ info: 'Total Revenue', value: `Rp ${meta.totalRevenue.toLocaleString()}` });
    if (reportData.statistics) {
      summarySheet.addRow({ info: 'Mean (Unit per Item)', value: reportData.statistics.mean.toFixed(2) });
      summarySheet.addRow({ info: 'Median (Unit per Item)', value: reportData.statistics.median });
      summarySheet.addRow({ info: 'Modus (Unit per Item)', value: reportData.statistics.modus.join(', ') || '-' });
      summarySheet.addRow({ info: 'Min (Unit per Item)', value: reportData.statistics.min });
      summarySheet.addRow({ info: 'Max (Unit per Item)', value: reportData.statistics.max });
      summarySheet.addRow({ info: 'Std Dev', value: reportData.statistics.stdDev.toFixed(2) });
    }
    summarySheet.addRow({});
    summarySheet.addRow({ info: 'TOP ITEMS', value: '' });
    reportData.topItems.forEach((item, idx) => {
      summarySheet.addRow({ info: `#${idx+1}`, value: `${item.name} — ${item.quantity} unit (${item.percentage}%)` });
    });
    summarySheet.addRow({});
    summarySheet.addRow({ info: 'BOTTOM ITEMS', value: '' });
    reportData.bottomItems.forEach((item, idx) => {
      summarySheet.addRow({ info: `#${idx+1}`, value: `${item.name} — ${item.quantity} unit (${item.percentage}%)` });
    });

    // Sheet 2: Detail
    const detailSheet = workbook.addWorksheet('Detail');
    const headers = query.groupBy === 'product' 
      ? ['ID Produk', 'Nama Produk', 'Total Unit', 'Total Revenue', 'Jumlah Order', 'Kontribusi (%)']
      : ['ID Varian', 'Nama Varian', 'Nama Produk', 'Total Unit', 'Total Revenue', 'Jumlah Order', 'Kontribusi (%)'];
    detailSheet.columns = headers.map(h => ({ header: h, key: h.toLowerCase().replace(/ /g, '_'), width: 20 }));
    for (const item of reportData.details) {
      if (query.groupBy === 'product') {
        detailSheet.addRow({
          id_produk: item.id,
          nama_produk: item.name,
          total_unit: item.quantity,
          total_revenue: `Rp ${item.revenue.toLocaleString()}`,
          jumlah_order: item.orderCount,
          kontribusi: `${item.percentage}%`,
        });
      } else {
        detailSheet.addRow({
          id_varian: item.id,
          nama_varian: item.name,
          nama_produk: item.productName,
          total_unit: item.quantity,
          total_revenue: `Rp ${item.revenue.toLocaleString()}`,
          jumlah_order: item.orderCount,
          kontribusi: `${item.percentage}%`,
        });
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  private emptyReport(query: ProductSalesQueryDto) {
    return {
      meta: {
        period: this.formatPeriod(query, null),
        status: query.status === 'all' ? 'all' : (query.status ?? 'completed'),
        groupBy: query.groupBy ?? 'product',
        totalOrders: 0,
        totalUnitsSold: 0,
        totalRevenue: 0,
      },
      statistics: null,
      topItems: [],
      bottomItems: [],
      details: [],
    };
  }
}