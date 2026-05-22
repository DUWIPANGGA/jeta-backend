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
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { CustomOrdersService } from './custom-orders.service';
import { CreateCustomOrderDto } from './dto/create-custom-order.dto';
import { UpdateCustomOrderDto } from './dto/update-custom-order.dto';
import { AcceptCustomOrderDto } from './dto/accept-custom-order.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';

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

// File filter for images only
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
@UseGuards(JwtAuthGuard)
export class CustomOrdersController {
  private readonly logger = new Logger(CustomOrdersController.name);
  constructor(private readonly customOrdersService: CustomOrdersService) {}

  // ==================== CREATE ====================
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('images', 10, { 
    storage, 
    fileFilter, 
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit per file
  }))
  async create(
    @Body() createCustomOrderDto: CreateCustomOrderDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: RequestWithUser,
  ) {
    if (!createCustomOrderDto.items || createCustomOrderDto.items.length === 0) {
      throw new BadRequestException('At least one item is required');
    }
    
    // Log untuk debugging
    this.logger.log(`Creating custom order for user ${req.user.id}`);
    this.logger.log(`Items: ${JSON.stringify(createCustomOrderDto.items)}`);
    
    return this.customOrdersService.create(createCustomOrderDto, req.user, files);
  }

  // ==================== FIND ALL (Admin only) ====================
  @Get()
  async findAll(@Req() req: RequestWithUser) {
    if (req.user.role_id !== 1) {
      throw new ForbiddenException('You do not have permission to view all custom orders');
    }
    return this.customOrdersService.findAll();
  }

  // ==================== STATISTICS ====================
  @Get('statistics')
  async getStatistics(@Req() req: RequestWithUser) {
    if (req.user.role_id !== 1) {
      throw new ForbiddenException('You do not have permission to view statistics');
    }
    return this.customOrdersService.getStatistics();
  }

  // ==================== FIND BY USER ====================
  @Get('user/:userId')
  async findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: RequestWithUser,
  ) {
    if (req.user.role_id !== 1 && req.user.id !== userId) {
      throw new ForbiddenException('You can only view your own custom orders');
    }
    return this.customOrdersService.findByUser(userId);
  }

  // ==================== FIND ONE ====================
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    const customOrder = await this.customOrdersService.findOne(id);
    if (req.user.role_id !== 1 && customOrder.user_id !== req.user.id) {
      throw new ForbiddenException('You do not have permission to view this order');
    }
    return customOrder;
  }

  // ==================== UPDATE ====================
  @Patch(':id')
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
    if (req.user.role_id !== 1 && customOrder.user_id !== req.user.id) {
      throw new ForbiddenException('You do not have permission to update this order');
    }
    return this.customOrdersService.update(id, updateCustomOrderDto, req.user, files);
  }

  // ==================== UPDATE ACCEPT STATUS ====================
  @Patch(':id/accept-status')
  async updateAcceptStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() acceptData: AcceptCustomOrderDto,
    @Req() req: RequestWithUser,
  ) {
    if (req.user.role_id !== 1) {
      throw new ForbiddenException('Only admin can change accept status');
    }
    return this.customOrdersService.updateAcceptStatus(id, true, acceptData);
  }

  // ==================== REJECT CUSTOM ORDER ====================
  @Patch(':id/reject')
  async rejectOrder(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    if (req.user.role_id !== 1) {
      throw new ForbiddenException('Only admin can reject orders');
    }
    return this.customOrdersService.updateAcceptStatus(id, false);
  }

  // ==================== DELETE ====================
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    const customOrder = await this.customOrdersService.findOne(id);
    if (req.user.role_id !== 1 && customOrder.user_id !== req.user.id) {
      throw new ForbiddenException('You do not have permission to delete this order');
    }
    return this.customOrdersService.remove(id);
  }

  // ==================== GET TOTAL QUANTITY ====================
  @Get(':id/total-quantity')
  async getTotalQuantity(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    const customOrder = await this.customOrdersService.findOne(id);
    if (req.user.role_id !== 1 && customOrder.user_id !== req.user.id) {
      throw new ForbiddenException('You do not have permission to view this order');
    }
    const totalQuantity = await this.customOrdersService.getTotalQuantityForProject(id);
    return { custom_order_id: id, total_quantity: totalQuantity };
  }
}