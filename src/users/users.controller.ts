// src/modules/users/users.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { Access } from '../common/decorator/access/access.decorator';
import { AccessGuard } from '../common/decorator/access/access.decorator';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard, AccessGuard)
export class UsersController {
  
  // Menggunakan page_id dari database (angka)
  @Get()
  @Access(23, 'read')  // page_id = 23 (users)
  findAll() {
    return 'Get all users';
  }

  @Post()
  @Access(23, 'create')
  create(@Body() createUserDto: any) {
    return 'Create user';
  }

  @Put(':id')
  @Access(23, 'update')
  update(@Param('id') id: string, @Body() updateUserDto: any) {
    return 'Update user';
  }

  @Delete(':id')
  @Access(23, 'delete')
  remove(@Param('id') id: string) {
    return 'Delete user';
  }
}