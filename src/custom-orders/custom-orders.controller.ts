// src/custom-orders/custom-orders.controller.ts
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
  ForbiddenException,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { CustomOrdersService } from './custom-orders.service';
import { CreateCustomOrderDto } from './dto/create-custom-order.dto';
import { UpdateCustomOrderDto } from './dto/update-custom-order.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';

const uploadDir = './uploads/custom-orders';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `custom-${uniqueSuffix}${extname(file.originalname)}`);
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

@Controller('custom-orders')
@UseGuards(JwtAuthGuard)
export class CustomOrdersController {
  private readonly logger = new Logger(CustomOrdersController.name);
  constructor(private readonly customOrdersService: CustomOrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('images', 10, { storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async create(
    @Body() createCustomOrderDto: CreateCustomOrderDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: RequestWithUser,
  ) {
    this.logger.log('Raw Body (after transform):', JSON.stringify(createCustomOrderDto, null, 2));
    this.logger.log('Items:', createCustomOrderDto.items);
    
    if (!createCustomOrderDto.items || createCustomOrderDto.items.length === 0) {
      throw new BadRequestException('At least one item is required');
    }
    return this.customOrdersService.create(createCustomOrderDto, req.user, files);
  }

  @Get()
  async findAll(@Req() req: RequestWithUser) {
    if (req.user.role_id !== 1) {
      throw new ForbiddenException('You do not have permission to view all custom orders');
    }
    return this.customOrdersService.findAll();
  }

  @Get('statistics')
  getStatistics() {
    return this.customOrdersService.getStatistics();
  }

  @Get('user/:userId')
  async findByUser(@Param('userId', ParseIntPipe) userId: number, @Req() req: RequestWithUser) {
    if (req.user.role_id !== 1 && req.user.id !== userId) {
      throw new ForbiddenException('You can only view your own custom orders');
    }
    return this.customOrdersService.findByUser(userId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const customOrder = await this.customOrdersService.findOne(id);
    if (req.user.role_id !== 1 && customOrder.user_id !== req.user.id) {
      throw new ForbiddenException('You do not have permission to view this order');
    }
    return customOrder;
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 10, { storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomOrderDto: UpdateCustomOrderDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: RequestWithUser,
  ) {
    const customOrder = await this.customOrdersService.findOne(id);
    if (req.user.role_id !== 1 && customOrder.user_id !== req.user.id) {
      throw new ForbiddenException('You do not have permission to update this order');
    }
    return this.customOrdersService.update(id, updateCustomOrderDto, req.user, files);
  }

  @Patch(':id/accept-status')
  async updateAcceptStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('accept_status') acceptStatus: boolean,
    @Req() req: RequestWithUser,
  ) {
    if (req.user.role_id !== 1) {
      throw new ForbiddenException('Only admin can change accept status');
    }
    return this.customOrdersService.updateAcceptStatus(id, acceptStatus);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const customOrder = await this.customOrdersService.findOne(id);
    if (req.user.role_id !== 1 && customOrder.user_id !== req.user.id) {
      throw new ForbiddenException('You do not have permission to delete this order');
    }
    return this.customOrdersService.remove(id);
  }
}