// src/custom-orders/custom-orders.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
  Req
} from '@nestjs/common';
import { CustomOrdersService } from './custom-orders.service';
import { CreateCustomOrderDto } from './dto/create-custom-order.dto';
import { UpdateCustomOrderDto } from './dto/update-custom-order.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';

@Controller('custom-orders')
export class CustomOrdersController {
  constructor(private readonly customOrdersService: CustomOrdersService) { }
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCustomOrderDto: CreateCustomOrderDto, @Req() req: any) {
    const user = req.user; // user sudah disimpan oleh JwtAuthGuard
    return this.customOrdersService.create(createCustomOrderDto, user);
  }

  @Get()
  findAll() {
    return this.customOrdersService.findAll();
  }

  @Get('statistics')
  getStatistics() {
    return this.customOrdersService.getStatistics();
  }

  @Get('user/:userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.customOrdersService.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customOrdersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomOrderDto: UpdateCustomOrderDto
  ) {
    return this.customOrdersService.update(id, updateCustomOrderDto);
  }

  @Patch(':id/accept-status')
  updateAcceptStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('accept_status') acceptStatus: boolean
  ) {
    return this.customOrdersService.updateAcceptStatus(id, acceptStatus);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customOrdersService.remove(id);
  }
}