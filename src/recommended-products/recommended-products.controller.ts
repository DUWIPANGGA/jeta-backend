import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { RecommendedProductsService } from './recommended-products.service';
import { CreateRecommendedProductDto } from './dto/create-recommended-product.dto';
import { UpdateRecommendedProductDto } from './dto/update-recommended-product.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';

@Controller('recommended-products')
@UseGuards(JwtAuthGuard, AccessGuard)
export class RecommendedProductsController {
  constructor(private readonly service: RecommendedProductsService) {}

  @Post()
  @Access('RecommendedProducts', 'create')
  create(@Body() createDto: CreateRecommendedProductDto) {
    return this.service.create(createDto);
  }

  @Get()
  @Access('RecommendedProducts', 'read')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Access('RecommendedProducts', 'read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Access('RecommendedProducts', 'update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateRecommendedProductDto,
  ) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @Access('RecommendedProducts', 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
