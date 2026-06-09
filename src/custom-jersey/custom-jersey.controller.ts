import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { CustomJerseyService } from './custom-jersey.service';
import { CreateCustomJerseyDto } from './dto/create-custom-jersey.dto';
import { CalculatePemainDto } from './dto/calculate-pemain.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';

const uploadDir = './uploads/custom-jersey';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `logo-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException('Only image files (JPEG, PNG, GIF, WEBP) are allowed!'),
      false,
    );
  }
};

interface RequestWithUser extends Request {
  user: { id: number; role_id: number };
}

@Controller('custom-jersey')
export class CustomJerseyController {
  constructor(private readonly customJerseyService: CustomJerseyService) {}
  
  @Post('calculate')
  @Access('CustomOrders', 'create')
  @HttpCode(HttpStatus.OK)
  async calculate(@Body() dto: CalculatePemainDto) {
    return this.customJerseyService.calculatePemain(dto);
  }
  
  @UseGuards(JwtAuthGuard, AccessGuard)
  @Post('order')
  @Access('CustomOrders', 'create')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage,
      fileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async createOrder(
    @Body() createDto: CreateCustomJerseyDto,
    @UploadedFile() logoFile: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    return this.customJerseyService.createOrder(createDto, req.user, logoFile);
  }

}
