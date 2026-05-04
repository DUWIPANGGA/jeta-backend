import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProductionLogsService } from './production-logs.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Roles } from 'src/common/decorator/roles/roles.decorator';
import { Role } from '@prisma/client';
import { Access } from '../common/decorator/access/access.decorator';


@Controller('production-logs')
export class ProductionLogsController {
  constructor(private readonly productionLogsService: ProductionLogsService) { }

  @UseGuards(JwtAuthGuard)
  @Access(14, 'create')
  @Post()
  create(@Body() createDto: any) {
    return this.productionLogsService.create(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(14, 'read')
  @Get()
  findAll() {
    return this.productionLogsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Access(14, 'read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productionLogsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Access(14, 'update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.productionLogsService.update(+id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(14, 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productionLogsService.remove(+id);
  }
}
