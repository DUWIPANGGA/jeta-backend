import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { StaffsService } from './staffs.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/decorator/roles/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Roles(Role.admin, Role.superadmin)
@Controller('staffs')
export class StaffsController {
  constructor(private readonly staffsService: StaffsService) { }

  @Get('profile')
  getProfile(@Request() req) {
    return this.staffsService.findByUserId(req.user.sub);
  }

  @Patch('profile')
  updateProfile(@Request() req, @Body() updateDto: any) {
    return this.staffsService.updateByUserId(req.user.sub, updateDto);
  }


  @Post()
  create(@Body() createDto: any) {
    return this.staffsService.create(createDto);
  }

  @Get()
  findAll() {
    return this.staffsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.staffsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.staffsService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.staffsService.remove(+id);
  }
}
