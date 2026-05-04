import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CartItemsService } from './cart-items.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@Controller('cart-items')
export class CartItemsController {
  constructor(private readonly cartItemsService: CartItemsService) { }

  @UseGuards(JwtAuthGuard)
  @Access(2, 'create')
  @Post()
  create(@Body() createDto: any) {
    return this.cartItemsService.create(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(2, 'read')
  @Get()
  findAll() {
    return this.cartItemsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Access(2, 'read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartItemsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Access(2, 'update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.cartItemsService.update(+id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(2, 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cartItemsService.remove(+id);
  }
}
