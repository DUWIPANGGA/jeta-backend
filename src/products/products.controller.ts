// src/products/products.controller.ts
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
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';
import { LogActivity } from '../common/decorator/activity-log/activity-log.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

const uploadDir = './uploads/products';
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

@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) { }

  // ==================== ENDPOINT PUBLIK (GUEST BISA AKSES) ====================
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

  // ==================== ENDPOINT YANG BUTUH AUTH (HANYA ADMIN/STAFF) ====================
  @Post()
  @UseGuards(JwtAuthGuard, AccessGuard)
  @Access('Products', 'create')
  @LogActivity('product', 'create')
  @UseInterceptors(FileInterceptor('image', { storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Product image is required');
    }
    return this.productsService.create(createProductDto, file);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @Access('Products', 'update')
  @LogActivity('product', 'update')
  @UseInterceptors(FileInterceptor('image', { storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.productsService.update(+id, updateProductDto, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @Access('Products', 'delete')
  @LogActivity('product', 'delete')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}