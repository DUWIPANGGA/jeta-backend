import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { storage, fileFilter } from 'src/common/utils/file-upload.utils';

import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/decorator/roles/roles.decorator';
import { Role } from '@prisma/client';
@UseGuards(JwtAuthGuard)
@Roles(Role.admin, Role.superadmin)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('profile')
  getProfile(@Request() req) {
    return this.usersService.findOne(req.user.sub);
  }

  @Patch('profile')
  @UseInterceptors(FileInterceptor('image', { storage: storage('profiles'), fileFilter }))
  updateProfile(@Request() req, @Body() updateDto: any, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      updateDto.image = `/uploads/profiles/${file.filename}`;
    }
    return this.usersService.update(req.user.sub, updateDto, req.user);
  }




  @Post()
  create(@Body() createDto: any) {
    return this.usersService.create(createDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', { storage: storage('profiles'), fileFilter }))
  update(@Param('id') id: string, @Body() updateDto: any, @Request() req, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      updateDto.image = `/uploads/profiles/${file.filename}`;
    }
    return this.usersService.update(+id, updateDto, req.user);
  }



  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.usersService.remove(+id, req.user);
  }

}
