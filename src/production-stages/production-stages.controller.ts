import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductionStagesService } from './production-stages.service';

@Controller('production-stages')
export class ProductionStagesController {
  constructor(private readonly productionStagesService: ProductionStagesService) {}

  @Post()
  create(@Body() createDto: any) {
    return this.productionStagesService.create(createDto);
  }

  @Get()
  findAll() {
    return this.productionStagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productionStagesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.productionStagesService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productionStagesService.remove(+id);
  }
}
