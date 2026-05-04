import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CustomOrdersService } from './custom-orders.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@Controller('custom-orders')
export class CustomOrdersController {
  constructor(private readonly customOrdersService: CustomOrdersService) { }

  @UseGuards(JwtAuthGuard)
  @Access(8, 'create')
  @Post()
  create(@Body() createDto: any) {
    return this.customOrdersService.create(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(8, 'read')
  @Get()
  findAll() {
    return this.customOrdersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Access(8, 'read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customOrdersService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Access(8, 'update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.customOrdersService.update(+id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(8, 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customOrdersService.remove(+id);
  }
}
