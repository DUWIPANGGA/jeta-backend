// src/variant-options/variant-options.controller.ts
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
  Query,
} from '@nestjs/common';
import { VariantOptionsService } from './variant-options.service';
import { CreateVariantOptionDto } from './dto/create-variant-option.dto';
import { UpdateVariantOptionDto } from './dto/update-variant-option.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';

@Controller('variant-options')
@UseGuards(JwtAuthGuard, AccessGuard)
export class VariantOptionsController {
  constructor(private readonly variantOptionsService: VariantOptionsService) {}

  @Post()
  @Access('VariantOptions', 'create')
  create(@Body() createDto: CreateVariantOptionDto) {
    return this.variantOptionsService.create(createDto);
  }

  @Get()
  @Access('VariantOptions', 'read')
  findAll(@Query('include_inactive') includeInactive?: string) {
    const includeInactiveBool = includeInactive === 'false' ? false : true;
    return this.variantOptionsService.findAll(includeInactiveBool);
  }

  @Get('by-custom-variant/:customVariantId')
  @Access('VariantOptions', 'read')
  findByCustomVariant(
    @Param('customVariantId', ParseIntPipe) customVariantId: number,
    @Query('include_inactive') includeInactive?: string,
  ) {
    const includeInactiveBool = includeInactive === 'true';
    return this.variantOptionsService.findByCustomVariant(customVariantId, includeInactiveBool);
  }

  @Get(':id')
  @Access('VariantOptions', 'read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.variantOptionsService.findOne(id);
  }

  @Patch(':id')
  @Access('VariantOptions', 'update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateVariantOptionDto,
  ) {
    return this.variantOptionsService.update(id, updateDto);
  }

  @Delete(':id')
  @Access('VariantOptions', 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.variantOptionsService.remove(id);
  }
}