// src/staffs/staffs.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { StaffService } from './staffs.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';
import { LogActivity } from '../common/decorator/activity-log/activity-log.decorator';

@Controller('staffs')
@UseGuards(JwtAuthGuard, AccessGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) { }

  @Post()
  @Access('Staffs', 'create')
  @LogActivity('staff', 'create')
  create(@Body() createDto: CreateStaffDto) {
    return this.staffService.create(createDto);
  }

  @Patch('user/:userId')
  @Access('Staffs', 'update')
  @LogActivity('staff', 'update')
  async updateOrCreateByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateDto: UpdateStaffDto,
  ) {
    return this.staffService.updateOrCreateByUserId(userId, updateDto);
  }

  @Get()
  @Access('Staffs', 'read')
  findAll() {
    return this.staffService.findAll();
  }

  @Get(':id')
  @Access('Staffs', 'read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.staffService.findOne(id);
  }

  @Patch(':id')
  @Access('Staffs', 'update')
  @LogActivity('staff', 'update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateStaffDto,
  ) {
    return this.staffService.update(id, updateDto);
  }

  @Delete(':id')
  @Access('Staffs', 'delete')
  @LogActivity('staff', 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.staffService.remove(id);
  }
}