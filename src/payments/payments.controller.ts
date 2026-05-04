import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @UseGuards(JwtAuthGuard)
  @Access(11, 'create')
  @Post()
  create(@Body() createDto: any) {
    return this.paymentsService.create(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(11, 'read')
  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Access(11, 'read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Access(11, 'update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.paymentsService.update(+id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(11, 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(+id);
  }
}
