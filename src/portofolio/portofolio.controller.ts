import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { PortofolioService } from './portofolio.service';
import { CreatePortofolioDto } from './dto/create-portofolio.dto';
import { UpdatePortofolioDto } from './dto/update-portofolio.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';
import { LogActivity } from 'src/common/decorator/activity-log/activity-log.decorator';

const uploadDir = './uploads/portofolios';
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
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return cb(new BadRequestException('Only image files are allowed!'), false);
  }
  cb(null, true);
};

@Controller('portofolios')
@UseGuards(JwtAuthGuard, AccessGuard)
export class PortofolioController {
  constructor(private readonly portofolioService: PortofolioService) {}

  @Post()
  @Access('Portofolio', 'create')
  @LogActivity('portofolio', 'create')
  @UseInterceptors(FileInterceptor('image', { storage, fileFilter, limits: { fileSize: 15 * 1024 * 1024 } }))
  async create(
    @Body() dto: CreatePortofolioDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image portofolio wajib diupload');
    }
    return this.portofolioService.create(dto, file);
  }

  @Get()
  @Access('Portofolio', 'read')
  findAll() {
    return this.portofolioService.findAll();
  }

  @Get(':id')
  @Access('Portofolio', 'read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.portofolioService.findOne(id);
  }

  @Patch(':id')
  @Access('Portofolio', 'update')
  @LogActivity('portofolio', 'update')
  @UseInterceptors(FileInterceptor('image', { storage, fileFilter, limits: { fileSize: 15 * 1024 * 1024 } }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePortofolioDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.portofolioService.update(id, dto, file);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Access('Portofolio', 'delete')
  @LogActivity('portofolio', 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.portofolioService.remove(id);
  }
}
