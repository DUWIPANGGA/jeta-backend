import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TrackingHistorysService } from './tracking-historys.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Roles } from 'src/common/decorator/roles/roles.decorator';
import { Role } from '@prisma/client';

@Controller('tracking-historys')
@UseGuards(JwtAuthGuard)
export class TrackingHistorysController {
  constructor(private readonly trackingHistorysService: TrackingHistorysService) { }
  @Roles(Role.admin, Role.superadmin)
  @Post()
  create(@Body() createDto: any) {
    return this.trackingHistorysService.create(createDto);
  }

  @Get()
  findAll() {
    return this.trackingHistorysService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trackingHistorysService.findOne(+id);
  }

  @Roles(Role.admin, Role.superadmin)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.trackingHistorysService.update(+id, updateDto);
  }

  @Roles(Role.admin, Role.superadmin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.trackingHistorysService.remove(+id);
  }
}
