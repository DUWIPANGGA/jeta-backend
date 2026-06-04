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
export class RecommendedProductsController {
  constructor(private readonly service: RecommendedProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AccessGuard)
  @Access('RecommendedProducts', 'create')
  create(@Body() createDto: CreateRecommendedProductDto) {
    return this.service.create(createDto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @Access('RecommendedProducts', 'update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateRecommendedProductDto,
  ) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @Access('RecommendedProducts', 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
