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
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';
import { PrismaService } from '../prisma/prisma.service';

const uploadDir = './uploads/progress';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `progress-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

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
@UseGuards(JwtAuthGuard, AccessGuard)
export class ProgressReportsController {
  constructor(
    private readonly service: ProgressReportsService,
    private readonly prisma: PrismaService,
  ) { }
  private readonly logger = new Logger(ProgressReportsController.name);

  @Post()
  @Access('ProgressReports', 'create')
  @UseInterceptors(FileInterceptor('image', { storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async create(
    @Body() createDto: CreateProgressReportDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    if (!file) {
      throw new BadRequestException('Foto bukti (image) wajib diupload');
    }
    return this.service.create(createDto, req.user.id, file);
  }

  @Get()
  @Access('ProgressReports', 'read')
  findAll(@Query('project_id') projectId?: string) {
    return this.service.findAll(projectId ? parseInt(projectId, 10) : undefined);
  }

  @Get('my-tasks')
  @Access('ProgressReports', 'read')
  getMyTasks(@Req() req: RequestWithUser) {
    return this.service.getMyTasks(req.user.id);
  }

  @Get('queue')
  @Access('ProgressReports', 'read')
  async getQueue(@Req() req: RequestWithUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true },
    });
    const isAdmin = user?.role?.name === 'superadmin' || user?.role?.name === 'admin';
    if (!isAdmin) {
      throw new ForbiddenException('Only admin can access queue');
    }
    return this.service.getQueue();
  }

  @Get('remaining/:customOrderItemId')
  @Access('ProgressReports', 'read')
  getRemainingQuantity(@Param('customOrderItemId', ParseIntPipe) customOrderItemId: number) {
    return this.service.getRemainingQuantity(customOrderItemId);
  }

  @Get(':id')
  @Access('ProgressReports', 'read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Access('ProgressReports', 'update')
  @UseInterceptors(FileInterceptor('image', { storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProgressReportDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true },
    });
    const isAdmin = user?.role?.name === 'superadmin' || user?.role?.name === 'admin';
    let imagePath: string | undefined = undefined;
    if (file) {
      imagePath = `/uploads/progress/${file.filename}`;
    }
    return this.service.update(id, dto, req.user.id, isAdmin, imagePath);
  }

  @Delete(':id')
  @Access('ProgressReports', 'delete')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true },
    });
    const isAdmin = user?.role?.name === 'superadmin' || user?.role?.name === 'admin';
    return this.service.remove(id, req.user.id, isAdmin);
  }
}