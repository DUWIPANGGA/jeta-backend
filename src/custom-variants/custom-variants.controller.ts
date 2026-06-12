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
import { CustomVariantsService } from './custom-variants.service';
import { CreateCustomVariantDto } from './dto/create-custom-variant.dto';
import { UpdateCustomVariantDto } from './dto/update-custom-variant.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';

@Controller('custom-variants')
@UseGuards(JwtAuthGuard, AccessGuard)
export class CustomVariantsController {
  constructor(private readonly customVariantsService: CustomVariantsService) {}
  
  @Get()
  @Access('CustomVariants', 'read')
  findAll(@Query('include_inactive') includeInactive?: string) {
    // 🔥 PERUBAHAN: default true jika tidak dikirim
    const includeInactiveBool = includeInactive === 'false' ? false : true;
    return this.customVariantsService.findAll(includeInactiveBool);
  }
  
  @Get(':id')
  @Access('CustomVariants', 'read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customVariantsService.findOne(id);
  }
  
  @Post()
  @Access('CustomVariants', 'create')
  create(@Body() createDto: CreateCustomVariantDto) {
    return this.customVariantsService.create(createDto);
  }


  @Patch(':id')
  @Access('CustomVariants', 'update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCustomVariantDto,
  ) {
    return this.customVariantsService.update(id, updateDto);
  }

  @Delete(':id')
  @Access('CustomVariants', 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customVariantsService.remove(id);
  }
}