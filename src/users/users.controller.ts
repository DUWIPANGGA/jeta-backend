// src/users/users.controller.ts
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
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';

interface RequestWithUser extends Request {
  user: { id: number; role_id: number };
}

@Controller('users')
@UseGuards(JwtAuthGuard, AccessGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // 🔥 ENDPOINT BARU: Get user permissions untuk frontend
  @Get('permissions')
  async getUserPermissions(@Req() req: RequestWithUser) {
    return this.usersService.getUserPermissions(req.user.id);
  }

  @Get()
  @Access(32, 'read')
  findAll() {
    return this.usersService.findAll();
  }

  @Get('staff')
  @Access(32, 'read')
  async getStaffWithDetails() {
    return this.usersService.getStaffWithDetails();
  }

  @Get(':id')
  @Access(32, 'read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Access(32, 'create')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  @Access(32, 'update')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Access(32, 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}