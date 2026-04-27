import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductionLogsService } from './production-logs.service';

@Controller('production-logs')
export class ProductionLogsController {
  constructor(private readonly productionLogsService: ProductionLogsService) {}

  @Post()
  create(@Body() createDto: any) {
    return this.productionLogsService.create(createDto);
  }

  @Get()
  findAll() {
    return this.productionLogsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productionLogsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.productionLogsService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productionLogsService.remove(+id);
  }
}
