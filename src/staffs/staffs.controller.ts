// src/staff/staff.controller.ts
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

@UseGuards(JwtAuthGuard)
@Controller('staffs')
export class StaffController {
  constructor(private readonly staffService: StaffService) { }

  @Post()
  create(@Body() createDto: CreateStaffDto) {
    return this.staffService.create(createDto);
  }

  @Patch('user/:userId')
  async updateOrCreateByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateDto: UpdateStaffDto,
  ) {
    return this.staffService.updateOrCreateByUserId(userId, updateDto);
  }

  @Get()
  findAll() {
    return this.staffService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.staffService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateStaffDto,
  ) {
    return this.staffService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.staffService.remove(id);
  }
}