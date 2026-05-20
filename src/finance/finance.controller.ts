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
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';

const uploadDir = './uploads/payments';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `payment-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

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
@UseGuards(JwtAuthGuard, AccessGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('staff-ranking')
  @Access(11, 'read')
  async getStaffRanking() {
    return this.financeService.getStaffRanking();
  }

  @Get('staff/:staffId/projects')
  @Access(11, 'read')
  async getStaffProjects(@Param('staffId', ParseIntPipe) staffId: number) {
    return this.financeService.getStaffProjects(staffId);
  }

  @Post('payments')
  @Access(11, 'create')
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