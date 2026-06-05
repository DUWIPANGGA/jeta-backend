import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { CarouselsService } from './carousels.service';
import { CreateCarouselDto } from './dto/create-carousel.dto';
import { UpdateCarouselDto } from './dto/update-carousel.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';

const uploadDir = './uploads/carousels';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|webm)$/i)) {
    return cb(new BadRequestException('Only image and video files are allowed!'), false);
  }
  cb(null, true);
};

@Controller('carousels')
export class CarouselsController {
  constructor(private readonly carouselsService: CarouselsService) {}

  @Get()
  findAll() {
    return this.carouselsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.carouselsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AccessGuard)
  @Access('Carousels', 'create')
  @UseInterceptors(FileInterceptor('media', { storage, fileFilter, limits: { fileSize: 15 * 1024 * 1024 } }))
  async create(
    @Body() createDto: CreateCarouselDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.carouselsService.create(createDto, file);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @Access('Carousels', 'update')
  @UseInterceptors(FileInterceptor('media', { storage, fileFilter, limits: { fileSize: 15 * 1024 * 1024 } }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCarouselDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.carouselsService.update(id, updateDto, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @Access('Carousels', 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.carouselsService.remove(id);
  }
}
