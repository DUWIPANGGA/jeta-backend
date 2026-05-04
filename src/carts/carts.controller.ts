import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CartsService } from './carts.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) { }

  @UseGuards(JwtAuthGuard)
  @Access(3, 'create')
  @Post()
  create(@Body() createDto: any) {
    return this.cartsService.create(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(3, 'read')
  @Get()
  findAll() {
    return this.cartsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Access(3, 'read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Access(3, 'update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.cartsService.update(+id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(3, 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cartsService.remove(+id);
  }
}
