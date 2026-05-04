import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TrackingHistoriesService } from './tracking-histories.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Roles } from 'src/common/decorator/roles/roles.decorator';
import { Role } from '@prisma/client';
import { Access } from '../common/decorator/access/access.decorator';


@Controller('tracking-historys')
@UseGuards(JwtAuthGuard)
export class TrackingHistoriesController

 {
  constructor(private readonly TrackingHistoriesService: TrackingHistoriesService) { }
 @Access(21, 'create')
  @Post()
  create(@Body() createDto: any) {
    return this.TrackingHistoriesService.create(createDto);
  }

  @Access(21, 'read')
  @Get()
  findAll() {
    return this.TrackingHistoriesService.findAll();
  }

  @Access(21, 'read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.TrackingHistoriesService.findOne(+id);
  }

  @Access(21, 'update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.TrackingHistoriesService.update(+id, updateDto);
  }

  @Access(21, 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.TrackingHistoriesService.remove(+id);
  }
}
