import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { ProductSalesQueryDto } from './dto/product-sales-query.dto';
import { ReportQueryDto, PeriodType } from './dto/report-query.dto';

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

  // ==================== NEW REPORT FITUR ====================

  private parsePeriodDates(query: ReportQueryDto) {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    const periodType = query.periodType ?? PeriodType.ALL;

    switch (periodType) {
      case PeriodType.DAILY:
        const targetDate = query.date ? new Date(query.date) : now;
        startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
        endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
        break;

      case PeriodType.WEEKLY:
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diff));
        startDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0, 0);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        endDate = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), 23, 59, 59, 999);
        break;

      case PeriodType.MONTHLY:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;

      case PeriodType.CUSTOM:
        if (query.startDate && query.endDate) {
          startDate = new Date(query.startDate);
          endDate = new Date(query.endDate);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
        } else {
          startDate = new Date(2000, 0, 1);
          endDate = new Date(2100, 11, 31);
        }
        break;

      case PeriodType.ALL:
      default:
        startDate = new Date(2000, 0, 1);
        endDate = new Date(2100, 11, 31);
        break;
    }

    return { startDate, endDate };
  }

  async getSalesReport(query: ReportQueryDto, userRoleId: number) {
    if (userRoleId !== 1 && userRoleId !== 5) {
      throw new ForbiddenException('Access denied. Only admin or finance can view reports.');
    }

    const { startDate, endDate } = this.parsePeriodDates(query);

    const catalogOrders = await this.prisma.order.findMany({
      where: {
        status: 'completed',
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        order_items: {
          include: {
            product: true,
          },
        },
      },
    });

    const customOrders = await this.prisma.customOrder.findMany({
      where: {
        payment_status: true,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: true,
        user: true,
      },
    });

    const catalogTransactionsCount = catalogOrders.length;
    const catalogRevenueSum = catalogOrders.reduce((sum, o) => sum + (o.grand_total ?? 0), 0);

    const customTransactionsCount = customOrders.length;
    const customRevenueSum = customOrders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);

    const totalTransactions = catalogTransactionsCount + customTransactionsCount;
    const totalRevenue = catalogRevenueSum + customRevenueSum;

    const productSalesMap = new Map<number, { productId: number; name: string; quantitySold: number; revenue: number }>();
    for (const order of catalogOrders) {
      for (const item of order.order_items) {
        if (!item.product) continue;
        const existing = productSalesMap.get(item.product_id);
        const itemPrice = item.price ?? item.product.price ?? 0;
        const itemRevenue = itemPrice * item.quantity;
        if (existing) {
          existing.quantitySold += item.quantity;
          existing.revenue += itemRevenue;
        } else {
          productSalesMap.set(item.product_id, {
            productId: item.product_id,
            name: item.product.name ?? 'Produk Tanpa Nama',
            quantitySold: item.quantity,
            revenue: itemRevenue,
          });
        }
      }
    }
    const bestSellingProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    const topCustomOrders = customOrders.map(co => {
      const totalQuantity = co.items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
      return {
        customOrderId: co.id,
        name: co.name ?? `Custom Order #${co.id}`,
        customerName: co.user?.name ?? co.offline_customer_name ?? 'Customer',
        totalQuantity,
        totalAmount: co.total_amount ?? 0,
      };
    })
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 5);

    return {
      meta: {
        periodType: query.periodType ?? PeriodType.ALL,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      summary: {
        totalTransactions,
        totalRevenue,
        totalCompletedOrders: totalTransactions,
        catalogOrders: {
          transactions: catalogTransactionsCount,
          revenue: catalogRevenueSum,
        },
        customOrders: {
          transactions: customTransactionsCount,
          revenue: customRevenueSum,
        },
      },
      bestSellingProducts,
      topCustomOrders,
    };
  }

  async exportSalesReport(query: ReportQueryDto, userRoleId: number) {
    const reportData = await this.getSalesReport(query, userRoleId);
    const workbook = new ExcelJS.Workbook();
    
    const summarySheet = workbook.addWorksheet('Rangkuman Penjualan');
    summarySheet.columns = [
      { header: 'Parameter', key: 'param', width: 25 },
      { header: 'Nilai', key: 'val', width: 35 },
    ];
    summarySheet.addRow({ param: 'Periode', val: `${reportData.meta.startDate} s/d ${reportData.meta.endDate}` });
    summarySheet.addRow({ param: 'Tipe Periode', val: reportData.meta.periodType.toUpperCase() });
    summarySheet.addRow({});
    
    summarySheet.addRow({ param: 'METRIK PENJUALAN', val: '' });
    summarySheet.addRow({ param: 'Total Transaksi', val: reportData.summary.totalTransactions });
    summarySheet.addRow({ param: 'Total Pendapatan', val: `Rp ${reportData.summary.totalRevenue.toLocaleString()}` });
    summarySheet.addRow({ param: 'Total Pesanan Selesai', val: reportData.summary.totalCompletedOrders });
    summarySheet.addRow({});

    summarySheet.addRow({ param: 'KATALOG ORDER', val: '' });
    summarySheet.addRow({ param: 'Jumlah Transaksi', val: reportData.summary.catalogOrders.transactions });
    summarySheet.addRow({ param: 'Pendapatan', val: `Rp ${reportData.summary.catalogOrders.revenue.toLocaleString()}` });
    summarySheet.addRow({});

    summarySheet.addRow({ param: 'CUSTOM ORDER', val: '' });
    summarySheet.addRow({ param: 'Jumlah Transaksi', val: reportData.summary.customOrders.transactions });
    summarySheet.addRow({ param: 'Pendapatan', val: `Rp ${reportData.summary.customOrders.revenue.toLocaleString()}` });
    
    const topSheet = workbook.addWorksheet('Produk & Custom Terpopuler');
    topSheet.addRow(['PRODUK KATALOG TERLARIS']);
    topSheet.addRow(['ID Produk', 'Nama Produk', 'Unit Terjual', 'Pendapatan']);
    for (const item of reportData.bestSellingProducts) {
      topSheet.addRow([item.productId, item.name, item.quantitySold, `Rp ${item.revenue.toLocaleString()}`]);
    }
    
    topSheet.addRow([]);
    topSheet.addRow(['CUSTOM ORDER TERPOPULER']);
    topSheet.addRow(['ID Custom Order', 'Nama Kustom', 'Pelanggan', 'Total Unit', 'Total Nilai']);
    for (const item of reportData.topCustomOrders) {
      topSheet.addRow([item.customOrderId, item.name, item.customerName, item.totalQuantity, `Rp ${item.totalAmount.toLocaleString()}`]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as any;
  }

  async getProductionReport(query: ReportQueryDto, userRoleId: number) {
    if (userRoleId !== 1 && userRoleId !== 5) {
      throw new ForbiddenException('Access denied. Only admin or finance can view reports.');
    }

    const { startDate, endDate } = this.parsePeriodDates(query);

    const projects = await this.prisma.project.findMany({
      where: {
        custom_order_id: { not: null },
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        custom_order: {
          include: {
            items: true,
            user: true,
          },
        },
        members: {
          include: {
            user: true,
          },
        },
        progressReports: {
          include: {
            stage: true,
            staff: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const stages = await this.prisma.stage.findMany({
      orderBy: { order_index: 'asc' },
    });
    const finalStageId = stages[stages.length - 1]?.id;

    let totalCompleted = 0;
    let totalInProgress = 0;
    let totalPending = 0;
    let totalItemsProducedSum = 0;

    const ordersDetails: any[] = [];

    for (const project of projects) {
      const customOrder = project.custom_order;
      if (!customOrder) continue;

      const totalQuantity = customOrder.items.reduce((sum, i) => sum + (i.quantity ?? 0), 0);

      const finalStageReports = project.progressReports.filter(
        pr => pr.stage_id === finalStageId && pr.status === 'selesai' && pr.approval_status === true
      );
      const completedFinalQty = finalStageReports.reduce((sum, pr) => sum + (pr.quantity ?? 0), 0);

      let status = 'Pending';
      if (project.status === false || (totalQuantity > 0 && completedFinalQty >= totalQuantity)) {
        status = 'Selesai';
        totalCompleted++;
      } else if (project.progressReports.some(pr => pr.status === 'proses' || pr.status === 'selesai')) {
        status = 'On Progress';
        totalInProgress++;
      } else {
        status = 'Pending';
        totalPending++;
      }

      const approvedReports = project.progressReports.filter(pr => pr.status === 'selesai' && pr.approval_status === true);
      const itemsProduced = approvedReports.reduce((sum, pr) => sum + (pr.quantity ?? 0), 0);
      totalItemsProducedSum += itemsProduced;

      let estimateDays = customOrder.production_estimate ?? 14;
      if (customOrder.deadline && customOrder.created_at) {
        const diffMs = new Date(customOrder.deadline).getTime() - new Date(customOrder.created_at).getTime();
        estimateDays = Math.max(1, Math.ceil(diffMs / (1000 * 3600 * 24)));
      }

      let actualDays: string | number = '-';
      if (status === 'Selesai') {
        const approvedDates = approvedReports.map(pr => new Date(pr.created_at).getTime());
        if (approvedDates.length > 0) {
          const lastApprovedDate = new Date(Math.max(...approvedDates));
          const startProdDate = new Date(project.created_at);
          const diffMs = lastApprovedDate.getTime() - startProdDate.getTime();
          actualDays = Math.max(1, Math.ceil(diffMs / (1000 * 3600 * 24)));
        } else {
          actualDays = 1;
        }
      } else {
        actualDays = 'Dalam Proses';
      }

      const staffSet = new Set<string>();
      project.members.forEach(m => {
        if (m.user?.name) staffSet.add(m.user.name);
      });
      project.progressReports.forEach(pr => {
        if (pr.staff?.user?.name) staffSet.add(pr.staff.user.name);
      });
      const staffMembers = Array.from(staffSet);

      ordersDetails.push({
        customOrderId: customOrder.id,
        name: customOrder.name ?? `Custom Order #${customOrder.id}`,
        customerName: customOrder.user?.name ?? customOrder.offline_customer_name ?? 'Customer',
        totalQuantity,
        status,
        createdAt: customOrder.created_at.toISOString().split('T')[0],
        deadline: customOrder.deadline ? customOrder.deadline.toISOString().split('T')[0] : '-',
        productionEstimateDays: estimateDays,
        actualProductionDays: actualDays,
        staffMembers,
      });
    }

    const topProductionCustomOrders = [...ordersDetails]
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5)
      .map(o => ({
        customOrderId: o.customOrderId,
        name: o.name,
        totalQuantity: o.totalQuantity,
        status: o.status,
      }));

    return {
      meta: {
        periodType: query.periodType ?? PeriodType.ALL,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      summary: {
        totalCustomOrdersEnteringProduction: projects.length,
        totalCustomOrdersCompleted: totalCompleted,
        totalCustomOrdersInProgress: totalInProgress,
        totalCustomOrdersPending: totalPending,
        totalItemsProduced: totalItemsProducedSum,
      },
      topProductionCustomOrders,
      orders: ordersDetails,
    };
  }

  async exportProductionReport(query: ReportQueryDto, userRoleId: number) {
    const reportData = await this.getProductionReport(query, userRoleId);
    const workbook = new ExcelJS.Workbook();

    const summarySheet = workbook.addWorksheet('Rangkuman Produksi');
    summarySheet.columns = [
      { header: 'Parameter', key: 'param', width: 25 },
      { header: 'Nilai', key: 'val', width: 35 },
    ];
    summarySheet.addRow({ param: 'Periode', val: `${reportData.meta.startDate} s/d ${reportData.meta.endDate}` });
    summarySheet.addRow({ param: 'Tipe Periode', val: reportData.meta.periodType.toUpperCase() });
    summarySheet.addRow({});

    summarySheet.addRow({ param: 'RINGKASAN KINERJA', val: '' });
    summarySheet.addRow({ param: 'Total Custom Order Diproduksi', val: reportData.summary.totalCustomOrdersEnteringProduction });
    summarySheet.addRow({ param: 'Total Selesai', val: reportData.summary.totalCustomOrdersCompleted });
    summarySheet.addRow({ param: 'Total Sedang Berjalan', val: reportData.summary.totalCustomOrdersInProgress });
    summarySheet.addRow({ param: 'Total Pending', val: reportData.summary.totalCustomOrdersPending });
    summarySheet.addRow({ param: 'Total Item Diproduksi', val: reportData.summary.totalItemsProduced });
    summarySheet.addRow({});

    summarySheet.addRow({ param: 'PRODUKSI TERBANYAK', val: '' });
    reportData.topProductionCustomOrders.forEach((item, idx) => {
      summarySheet.addRow({ param: `#${idx+1}`, val: `${item.name} — ${item.totalQuantity} unit (${item.status})` });
    });

    const detailSheet = workbook.addWorksheet('Detail Pengerjaan');
    detailSheet.columns = [
      { header: 'ID Custom Order', key: 'id', width: 15 },
      { header: 'Nama Kustom', key: 'name', width: 25 },
      { header: 'Customer', key: 'customer', width: 20 },
      { header: 'Total Qty', key: 'qty', width: 10 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Tanggal Dibuat', key: 'created', width: 15 },
      { header: 'Deadline', key: 'deadline', width: 15 },
      { header: 'Estimasi (Hari)', key: 'est', width: 15 },
      { header: 'Realisasi (Hari)', key: 'act', width: 15 },
      { header: 'Staff Terlibat', key: 'staff', width: 35 },
    ];

    for (const order of reportData.orders) {
      detailSheet.addRow({
        id: order.customOrderId,
        name: order.name,
        customer: order.customerName,
        qty: order.totalQuantity,
        status: order.status,
        created: order.createdAt,
        deadline: order.deadline,
        est: order.productionEstimateDays,
        act: order.actualProductionDays,
        staff: order.staffMembers.join(', ') || '-',
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as any;
  }
}