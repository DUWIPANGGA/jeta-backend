// src/reports/reports.controller.ts
import { Controller, Get, Query, UseGuards, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';
import { ProductSalesQueryDto } from './dto/product-sales-query.dto';
import { ReportQueryDto } from './dto/report-query.dto';

interface RequestWithUser extends Request {
  user: { id: number; role_id: number };
}

@Controller('reports')
@UseGuards(JwtAuthGuard, AccessGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Get('product-sales')
  @Access('Reports', 'read')
  async getProductSalesReport(
    @Query() query: ProductSalesQueryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.reportsService.getProductSalesReport(query, req.user.role_id);
  }

  @Get('product-sales/export')
  @Access('Reports', 'read')
  async exportProductSalesReport(
    @Query() query: ProductSalesQueryDto,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportProductSalesReport(query, req.user.role_id);
    res.setHeader('Content-Disposition', 'attachment; filename="product_sales_report.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  }

  @Get('sales')
  @Access('Reports', 'read')
  async getSalesReport(
    @Query() query: ReportQueryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.reportsService.getSalesReport(query, req.user.role_id);
  }

  @Get('sales/export')
  @Access('Reports', 'read')
  async exportSalesReport(
    @Query() query: ReportQueryDto,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportSalesReport(query, req.user.role_id);
    res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  }

  @Get('production')
  @Access('Reports', 'read')
  async getProductionReport(
    @Query() query: ReportQueryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.reportsService.getProductionReport(query, req.user.role_id);
  }

  @Get('production/export')
  @Access('Reports', 'read')
  async exportProductionReport(
    @Query() query: ReportQueryDto,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportProductionReport(query, req.user.role_id);
    res.setHeader('Content-Disposition', 'attachment; filename="production_report.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  }
}