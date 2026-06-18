// src/product-variants/product-variants.controller.ts
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
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { ProductVariantsService } from './product-variants.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';
import { LogActivity } from 'src/common/decorator/activity-log/activity-log.decorator';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

const uploadDir = './uploads/product-variants';
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

@Controller('product-variants')
@UseGuards(JwtAuthGuard, AccessGuard)
export class ProductVariantsController {
  constructor(private readonly productVariantsService: ProductVariantsService) { }

  @Post()
  @Access('ProductVariants', 'create')
  @LogActivity('productVariant', 'create')
  @UseInterceptors(FileInterceptor('image', { storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async create(
    @Body() createDto: CreateProductVariantDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.productVariantsService.create(createDto, file);
  }

  @Get()
  @Access('ProductVariants', 'read')
  findAll(@Query('product_id') productId?: string) {
    return this.productVariantsService.findAll(productId ? +productId : undefined);
  }

  @Get(':id')
  @Access('ProductVariants', 'read')
  findOne(@Param('id') id: string) {
    return this.productVariantsService.findOne(+id);
  }

  @Patch(':id')
  @Access('ProductVariants', 'update')
  @LogActivity('productVariant', 'update')
  @UseInterceptors(FileInterceptor('image', { storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProductVariantDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.productVariantsService.update(+id, updateDto, file);
  }

  @Delete(':id')
  @Access('ProductVariants', 'delete')
  @LogActivity('productVariant', 'delete')
  remove(@Param('id') id: string) {
    return this.productVariantsService.remove(+id);
  }
}