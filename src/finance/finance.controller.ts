import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { FinanceService } from './finance.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CalculateSalaryDto } from './dto/calculate-salary.dto';
import { ProcessSalaryDto } from './dto/process-salary.dto';
import { WeeklyTutupBukuQueryDto } from './dto/weekly-tutup-buku.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';
import { LogActivity } from '../common/decorator/activity-log/activity-log.decorator';

const paymentDir = './uploads/payments';
if (!fs.existsSync(paymentDir)) {
  fs.mkdirSync(paymentDir, { recursive: true });
}
const salaryDir = './uploads/salary';
if (!fs.existsSync(salaryDir)) {
  fs.mkdirSync(salaryDir, { recursive: true });
}

const paymentStorage = diskStorage({
  destination: (req, file, cb) => cb(null, paymentDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `payment-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

const salaryStorage = diskStorage({
  destination: (req, file, cb) => cb(null, salaryDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `salary-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|pdf)$/i;

  if (allowedExtensions.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Only image files (JPG, JPEG, PNG, GIF, WEBP) and PDF are allowed!'), false);
  }
};

interface RequestWithUser extends Request {
  user: { id: number; role_id: number };
}

@Controller('finance')
@UseGuards(JwtAuthGuard, AccessGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) { }

  // ==================== STAFF RANKING ====================
  @Get('staff-ranking')
  @Access('Finance', 'read')
  async getStaffRanking() {
    return this.financeService.getStaffRanking();
  }

  // ==================== DAFTAR PROYEK STAFF ====================
  @Get('staff/:staffId/projects')
  @Access('Finance', 'read')
  async getStaffProjects(@Param('staffId', ParseIntPipe) staffId: number) {
    return this.financeService.getStaffProjects(staffId);
  }

  // ==================== PEMBAYARAN PER PROYEK (EXISTING) ====================
  @Post('payments')
  @Access('Finance', 'create')
  @LogActivity('salaryPayment', 'create')
  @UseInterceptors(FileInterceptor('proof', { storage: paymentStorage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async createPayment(
    @Body() createDto: CreatePaymentDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    if (!file) {
      throw new BadRequestException('Bukti pembayaran (proof) wajib diupload');
    }
    return this.financeService.createPayment(createDto, req.user.id, file);
  }

  // ==================== PREVIEW GAJI PER PERIODE (BARU) ====================
  @Post('salary/preview')
  @Access('Finance', 'read')
  async previewSalaryByPeriod(@Body() dto: CalculateSalaryDto) {
    return this.financeService.previewSalaryByPeriod(dto);
  }

  // ==================== PROSES GAJI PER PERIODE (BARU) ====================
  @Post('salary/pay')
  @Access('Finance', 'create')
  @LogActivity('salaryPayment', 'create')
  @UseInterceptors(FileInterceptor('proof', { storage: salaryStorage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async processSalaryByPeriod(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ProcessSalaryDto,
    @Req() req: RequestWithUser,
  ) {
    if (!file) {
      throw new BadRequestException('Bukti pembayaran gaji (proof) wajib diupload');
    }
    return this.financeService.processSalaryByPeriod(dto, req.user.id, file);
  }

  // ==================== GET GAJI STAFF BY PERIODE (BARU) ====================
  @Get('salary/staff/:staffId')
  @Access('Finance', 'read')
  async getSalaryByPeriod(
    @Param('staffId', ParseIntPipe) staffId: number,
    @Query('period_type') periodType: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.financeService.getSalaryByPeriod(
      staffId,
      periodType as any,
      year ? parseInt(year) : undefined,
      month ? parseInt(month) : undefined,
    );
  }

  // ==================== PELAPORAN TUTUP BUKU DINAMIS ====================
  @Get('tutup-buku')
  @Access('Finance', 'read')
  async getTutupBukuReport(@Query() query: WeeklyTutupBukuQueryDto) {
    return this.financeService.getTutupBukuReport(query);
  }
}