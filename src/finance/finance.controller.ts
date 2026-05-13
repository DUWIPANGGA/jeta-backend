// src/finance/finance.controller.ts
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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { FinanceService } from './finance.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';

// Buat folder upload untuk bukti pembayaran jika belum ada
const uploadDir = './uploads/payments';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi penyimpanan file
const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `payment-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

// Filter file (hanya gambar dan PDF)
const fileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|pdf)$/i)) {
    return cb(new BadRequestException('Only image or PDF files are allowed!'), false);
  }
  cb(null, true);
};

interface RequestWithUser extends Request {
  user: { id: number; role_id: number };
}

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) { }

  /**
   * GET /finance/staff-ranking
   * Mendapatkan daftar staff diurutkan berdasarkan total pendapatan (terbanyak ke tersedikit)
   */
  @Get('staff-ranking')
  async getStaffRanking() {
    return this.financeService.getStaffRanking();
  }

  /**
   * GET /finance/staff/:staffId/projects
   * Mendapatkan daftar proyek yang dikerjakan oleh staff beserta nominal yang akan diterima
   */
  @Get('staff/:staffId/projects')
  async getStaffProjects(@Param('staffId', ParseIntPipe) staffId: number) {
    return this.financeService.getStaffProjects(staffId);
  }

  /**
   * POST /finance/payments
   * Membuat pembayaran gaji untuk staff (upload bukti pembayaran)
   * Body: multipart/form-data
   *   - staff_id: number
   *   - project_ids: number[] (array)
   *   - notes: string (optional)
   *   - proof: file (image/pdf)
   */
  @Post('payments')
  @UseInterceptors(FileInterceptor('proof', { storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
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
}