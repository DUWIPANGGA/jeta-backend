// src/payments/payments.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const storage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads/payments';
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `proof-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@Controller('payments')
@UseGuards(JwtAuthGuard, AccessGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post()
  @Access('Payments', 'create')
  create(@Body() createDto: CreatePaymentDto) {
    return this.paymentsService.create(createDto);
  }

  @Get()
  @Access('Payments', 'read')
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get('pending')
  @Access('Payments', 'read')
  findPending() {
    return this.paymentsService.findPending();
  }

  @Get(':id')
  @Access('Payments', 'read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findOne(id);
  }

  @Post(':id/upload-proof')
  @Access('Payments', 'update')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|pdf)$/)) {
          return cb(new BadRequestException('Only images and PDFs are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadProof(
    @Param('id', ParseIntPipe) id: number, 
    @UploadedFile() file: Express.Multer.File,
    @Body('amount') amount?: string,
    @Body('payment_method_id') paymentMethodId?: string,
    @Req() req?: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const filePath = `/uploads/payments/${file.filename}`;
    return this.paymentsService.uploadProof(
      id, 
      filePath,
      amount ? parseInt(amount) : undefined,
      paymentMethodId ? parseInt(paymentMethodId) : undefined,
      req?.user?.id,
    );
  }

  @Patch(':id/verify')
  @Access('Payments', 'update')
  verify(
    @Param('id', ParseIntPipe) id: number, 
    @Body('status') status: 'completed' | 'failed',
    @Body('amount') amount?: number
  ) {
    if (!['completed', 'failed'].includes(status)) {
      throw new BadRequestException('Invalid status');
    }
    return this.paymentsService.verifyPayment(id, status, amount);
  }

  @Patch(':id')
  @Access('Payments', 'update')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdatePaymentDto) {
    return this.paymentsService.update(id, updateDto);
  }

  @Delete(':id')
  @Access('Payments', 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.remove(id);
  }
}