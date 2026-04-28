import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TrackingsService } from './trackings.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/decorator/roles/roles.decorator';
import { Role } from '@prisma/client';

@Controller('trackings')
export class TrackingsController {
  constructor(private readonly trackingsService: TrackingsService) { }
  @UseGuards(JwtAuthGuard)
  @Roles(Role.admin, Role.superadmin)
  @Post()
  create(@Body() createDto: any) {
    return this.trackingsService.create(createDto);
  }
  @UseGuards(JwtAuthGuard)
  @Roles(Role.admin, Role.superadmin)
  @Get()
  findAll() {
    return this.trackingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trackingsService.findOne(+id);
  }
  @UseGuards(JwtAuthGuard)
  @Roles(Role.admin, Role.superadmin)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.trackingsService.update(+id, updateDto);
  }
  @UseGuards(JwtAuthGuard)
  @Roles(Role.admin, Role.superadmin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.trackingsService.remove(+id);
  }
}
