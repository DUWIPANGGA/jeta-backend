import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CustomOrdersService } from './custom-orders.service';

@Controller('custom-orders')
export class CustomOrdersController {
  constructor(private readonly customOrdersService: CustomOrdersService) {}

  @Post()
  create(@Body() createDto: any) {
    return this.customOrdersService.create(createDto);
  }

  @Get()
  findAll() {
    return this.customOrdersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customOrdersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.customOrdersService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customOrdersService.remove(+id);
  }
}
