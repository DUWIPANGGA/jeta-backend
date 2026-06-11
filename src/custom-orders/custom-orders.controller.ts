import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
  Req,
  HttpException,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Logger,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { CustomOrdersService } from './custom-orders.service';
import { CreateCustomOrderDto } from './dto/create-custom-order.dto';
import { UpdateCustomOrderDto } from './dto/update-custom-order.dto';
import { CreateAdminCustomOrderDto } from './dto/create-admin-custom-order.dto';
import { AcceptCustomOrderDto } from './dto/accept-custom-order.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';
import { PrismaService } from '../prisma/prisma.service';

// Setup upload directory
const uploadDir = './uploads/custom-orders';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Setup storage configuration
const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `custom-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

// File filter for images and PDF
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Only image files (JPEG, PNG, GIF, WEBP) and PDF are allowed!'), false);
  }
};

interface RequestWithUser extends Request {
  user: { id: number; role_id: number };
}

@Controller('custom-orders')
@UseGuards(JwtAuthGuard, AccessGuard)
export class CustomOrdersController {
  private readonly logger = new Logger(CustomOrdersController.name);
  constructor(
    private readonly customOrdersService: CustomOrdersService,
    private readonly prisma: PrismaService,
  ) { }

  // ==================== CREATE (USER) ====================
  @Post()
  @Access('CustomOrders', 'create')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('images', 10, {
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
  }))
  async create(
    @Body() createCustomOrderDto: CreateCustomOrderDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: RequestWithUser,
  ) {
    if (!createCustomOrderDto.items || createCustomOrderDto.items.length === 0) {
      throw new BadRequestException('At least one item is required');
    }

    this.logger.log(`Creating custom order for user ${req.user.id}`);

    return this.customOrdersService.create(createCustomOrderDto, req.user, files);
  }

  // ==================== CREATE (ADMIN) ====================
  @Post('admin')
  @Access('CustomOrders', 'create')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('images', 10, {
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
  }))
  async createAdminOrder(
    @Body() createAdminCustomOrderDto: CreateAdminCustomOrderDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: RequestWithUser,
  ) {
    if (!createAdminCustomOrderDto.items || createAdminCustomOrderDto.items.length === 0) {
      throw new BadRequestException('At least one item is required');
    }

    this.logger.log(`Creating admin custom order for user ${req.user.id}`);

    return this.customOrdersService.createAdminOrder(createAdminCustomOrderDto, req.user, files);
  }

  // ==================== FIND ALL ====================
  @Get()
  @Access('CustomOrders', 'read')
  async findAll(@Req() req: RequestWithUser) {
    return this.customOrdersService.findAll(req.user.id);
  }

  // ==================== STATISTICS ====================
  @Get('statistics')
  @Access('CustomOrders', 'read')
  async getStatistics(@Req() req: RequestWithUser) {
    return this.customOrdersService.getStatistics();
  }

  // ==================== FIND BY USER ====================
  @Get('user/:userId')
  @Access('CustomOrders', 'read')
  async findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: RequestWithUser,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true },
    });
    const isAdmin = user?.role?.name === 'superadmin' || user?.role?.name === 'admin';
    if (!isAdmin && req.user.id !== userId) {
      throw new HttpException('You can only view your own custom orders', HttpStatus.FORBIDDEN);
    }
    return this.customOrdersService.findByUser(userId, req.user.id);
  }

  // ==================== FIND ONE ====================
  @Get(':id')
  @Access('CustomOrders', 'read')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    const customOrder = await this.customOrdersService.findOne(id, req.user.id);
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true },
    });
    const isAdmin = user?.role?.name === 'superadmin' || user?.role?.name === 'admin';
    if (!isAdmin && customOrder.user_id !== req.user.id) {
      throw new HttpException('You do not have permission to view this order', HttpStatus.FORBIDDEN);
    }
    return customOrder;
  }

  // ==================== UPDATE ====================
  @Patch(':id')
  @Access('CustomOrders', 'update')
  @UseInterceptors(FilesInterceptor('images', 10, {
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
  }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomOrderDto: UpdateCustomOrderDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: RequestWithUser,
  ) {
    const customOrder = await this.customOrdersService.findOne(id);
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true },
    });
    const isAdmin = user?.role?.name === 'superadmin' || user?.role?.name === 'admin';
    if (!isAdmin && customOrder.user_id !== req.user.id) {
      throw new HttpException('You do not have permission to update this order', HttpStatus.FORBIDDEN);
    }
    return this.customOrdersService.update(id, updateCustomOrderDto, req.user, files);
  }

  // ==================== UPDATE ACCEPT STATUS ====================
  @Patch(':id/accept-status')
  @Access('CustomOrders', 'update')
  async updateAcceptStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() acceptData: AcceptCustomOrderDto,
    @Req() req: RequestWithUser,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true },
    });
    const isAdmin = user?.role?.name === 'superadmin' || user?.role?.name === 'admin';
    if (!isAdmin) {
      throw new HttpException('Only admin can change accept status', HttpStatus.FORBIDDEN);
    }
    return this.customOrdersService.updateAcceptStatus(id, 'accepted', acceptData);
  }

  // ==================== REJECT CUSTOM ORDER ====================
  @Patch(':id/reject')
  @Access('CustomOrders', 'update')
  async rejectOrder(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true },
    });
    const isAdmin = user?.role?.name === 'superadmin' || user?.role?.name === 'admin';
    if (!isAdmin) {
      throw new HttpException('Only admin can reject orders', HttpStatus.FORBIDDEN);
    }
    return this.customOrdersService.updateAcceptStatus(id, 'rejected');
  }

  // ==================== DELETE ====================
  @Delete(':id')
  @Access('CustomOrders', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    const customOrder = await this.customOrdersService.findOne(id);
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true },
    });
    const isAdmin = user?.role?.name === 'superadmin' || user?.role?.name === 'admin';
    if (!isAdmin && customOrder.user_id !== req.user.id) {
      throw new HttpException('You do not have permission to delete this order', HttpStatus.FORBIDDEN);
    }
    return this.customOrdersService.remove(id);
  }

  // ==================== GET TOTAL QUANTITY ====================
  @Get(':id/total-quantity')
  @Access('CustomOrders', 'read')
  async getTotalQuantity(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    const customOrder = await this.customOrdersService.findOne(id);
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true },
    });
    const isAdmin = user?.role?.name === 'superadmin' || user?.role?.name === 'admin';
    if (!isAdmin && customOrder.user_id !== req.user.id) {
      throw new HttpException('You do not have permission to view this order', HttpStatus.FORBIDDEN);
    }
    const totalQuantity = await this.customOrdersService.getTotalQuantityForProject(id);
    return { custom_order_id: id, total_quantity: totalQuantity };
  }
}