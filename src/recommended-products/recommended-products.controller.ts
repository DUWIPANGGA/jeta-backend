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
import { LogActivity } from '../common/decorator/activity-log/activity-log.decorator';

@Controller('recommended-products')
export class RecommendedProductsController {
  constructor(private readonly service: RecommendedProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AccessGuard)
  @Access('RecommendedProducts', 'create')
  @LogActivity('recommendedProduct', 'create')
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
  @LogActivity('recommendedProduct', 'update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateRecommendedProductDto,
  ) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @Access('RecommendedProducts', 'delete')
  @LogActivity('recommendedProduct', 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
