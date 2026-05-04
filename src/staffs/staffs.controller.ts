import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { StaffsService } from './staffs.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/decorator/roles/roles.decorator';
import { Role } from '@prisma/client';
import { Access } from '../common/decorator/access/access.decorator';



@Controller('staffs')
export class StaffsController {
  constructor(private readonly staffsService: StaffsService) { }

  @UseGuards(JwtAuthGuard)
  @Access(19, 'create')
  @Post()
  create(@Body() createDto: any) {
    return this.staffsService.create(createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(19, 'read')
  @Get('profile')
  getProfile(@Request() req) {
    return this.staffsService.findByUserId(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Access(19, 'update')
  @Patch('profile')
  updateProfile(@Request() req, @Body() updateDto: any) {
    return this.staffsService.updateByUserId(req.user.sub, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(19, 'read')
  @Get()
  findAll() {
    return this.staffsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Access(19, 'read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.staffsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Access(19, 'update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.staffsService.update(+id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Access(19, 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.staffsService.remove(+id);
  }
}
