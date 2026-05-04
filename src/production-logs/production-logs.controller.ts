import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProductionLogsService } from './production-logs.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Roles } from 'src/common/decorator/roles/roles.decorator';
import { Role } from '@prisma/client';

@Controller('production-logs')
export class ProductionLogsController {
  constructor(private readonly productionLogsService: ProductionLogsService) { }
  @UseGuards(JwtAuthGuard)
  @Roles(1, 2)
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

  @UseGuards(JwtAuthGuard)
  @Roles(1, 2)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.productionLogsService.update(+id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(1, 2)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productionLogsService.remove(+id);
  }
}
