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
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { Roles } from '../common/decorator/roles/roles.decorator';
import { Role, ProductStatus } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

// Pastikan folder uploads ada
const uploadDir = './uploads/products';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi multer
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

@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {}

  // Public endpoints
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get('category/:category_id')
  findByCategory(@Param('category_id') categoryId: string) {
    return this.productsService.findByCategory(+categoryId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  // Admin endpoints with file upload
  @UseGuards(JwtAuthGuard)
  @Roles(Role.admin, Role.superadmin)
  @Post()
  @UseInterceptors(FileInterceptor('image', { 
    storage, 
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  async create(
    @Body() createProductDto: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.logger.log('Create product request received');
    this.logger.log('Body:', createProductDto);
    this.logger.log('File:', file ? file.originalname : 'No file');
    
    if (!file) {
      throw new BadRequestException('Product image is required');
    }
    
    return this.productsService.create(createProductDto, file);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(Role.admin, Role.superadmin)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', { 
    storage, 
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  }))
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.logger.log(`Update product ${id} request received`);
    this.logger.log('Body:', updateProductDto);
    this.logger.log('File:', file ? file.originalname : 'No file');
    
    return this.productsService.update(+id, updateProductDto, file);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(Role.admin, Role.superadmin)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ProductStatus,
  ) {
    return this.productsService.updateStatus(+id, status);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(Role.admin, Role.superadmin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}