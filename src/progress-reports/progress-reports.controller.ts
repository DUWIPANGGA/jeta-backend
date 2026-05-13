// src/progress-reports/progress-reports.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
  Logger,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { ProgressReportsService } from './progress-reports.service';
import { CreateProgressReportDto } from './dto/create-progress-report.dto';
import { UpdateProgressReportDto } from './dto/update-progress-report.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';

// Buat folder upload jika belum ada
const uploadDir = './uploads/progress';
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
    cb(null, `progress-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

// Filter file (hanya gambar)
const fileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return cb(new BadRequestException('Only image files are allowed!'), false);
  }
  cb(null, true);
};

interface RequestWithUser extends Request {
  user: { id: number; role_id: number };
}

@Controller('progress-reports')
@UseGuards(JwtAuthGuard)
export class ProgressReportsController {
  constructor(private readonly service: ProgressReportsService) { }
  private readonly logger = new Logger(ProgressReportsController.name);

  // CREATE (dengan upload gambar)
  @Post()
  @UseInterceptors(FileInterceptor('image', { storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async create(
    @Body() createProgressReportDto: CreateProgressReportDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    if (!file) {
      throw new BadRequestException('Progress image is required');
    }
    return this.service.create(createProgressReportDto, req.user.id, file);
  }

  // GET ALL
  @Get()
  findAll(@Query('project_id') projectId?: string) {
    return this.service.findAll(projectId ? parseInt(projectId, 10) : undefined);
  }

  // GET MY TASKS
  @Get('my-tasks')
  getMyTasks(@Req() req: RequestWithUser) {
    return this.service.getMyTasks(req.user.id);
  }

  // GET QUEUE (hanya admin)
  @Get('queue')
  getQueue(@Req() req: RequestWithUser) {
    if (req.user.role_id !== 1) {
      throw new ForbiddenException('Only admin can access queue');
    }
    return this.service.getQueue();
  }

  // GET ONE
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // UPDATE (dengan upload gambar opsional)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', { storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProgressReportDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    const isAdmin = req.user.role_id === 1;
    let imagePath: string | undefined = undefined;
    if (file) {
      imagePath = `/uploads/progress/${file.filename}`;
    }
    return this.service.update(id, dto, req.user.id, isAdmin, imagePath);
  }

  // DELETE
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const isAdmin = req.user.role_id === 1;
    return this.service.remove(id, req.user.id, isAdmin);
  }
}