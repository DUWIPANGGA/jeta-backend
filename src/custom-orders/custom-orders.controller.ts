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
  Req,
  ForbiddenException,
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
    const user = req.user;
    return this.customOrdersService.create(createCustomOrderDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Req() req: any) {
    const currentUser = req.user;
    // Hanya admin (role_id = 1) yang boleh melihat semua custom order
    if (currentUser.role_id !== 1) {
      throw new ForbiddenException('You do not have permission to view all custom orders');
    }
    return this.customOrdersService.findAll();
  }

  @Get('statistics')
  getStatistics() {
    return this.customOrdersService.getStatistics();
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  async findByUser(@Param('userId', ParseIntPipe) userId: number, @Req() req: any) {
    const currentUser = req.user;
    // Admin atau user yang sama
    if (currentUser.role_id !== 1 && currentUser.id !== userId) {
      throw new ForbiddenException('You can only view your own custom orders');
    }
    return this.customOrdersService.findByUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const customOrder = await this.customOrdersService.findOne(id);
    const currentUser = req.user;
    // Admin atau pemilik order
    if (currentUser.role_id !== 1 && customOrder.user_id !== currentUser.id) {
      throw new ForbiddenException('You do not have permission to view this order');
    }
    return customOrder;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomOrderDto: UpdateCustomOrderDto,
    @Req() req: any,
  ) {
    const customOrder = await this.customOrdersService.findOne(id);
    const currentUser = req.user;
    if (currentUser.role_id !== 1 && customOrder.user_id !== currentUser.id) {
      throw new ForbiddenException('You do not have permission to update this order');
    }
    return this.customOrdersService.update(id, updateCustomOrderDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/accept-status')
  async updateAcceptStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('accept_status') acceptStatus: boolean,
    @Req() req: any,
  ) {
    const customOrder = await this.customOrdersService.findOne(id);
    const currentUser = req.user;
    // Hanya admin yang bisa mengubah accept_status
    if (currentUser.role_id !== 1) {
      throw new ForbiddenException('Only admin can change accept status');
    }
    return this.customOrdersService.updateAcceptStatus(id, acceptStatus);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const customOrder = await this.customOrdersService.findOne(id);
    const currentUser = req.user;
    if (currentUser.role_id !== 1 && customOrder.user_id !== currentUser.id) {
      throw new ForbiddenException('You do not have permission to delete this order');
    }
    return this.customOrdersService.remove(id);
  }
}