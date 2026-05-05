import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { Access } from '../common/decorator/access/access.decorator';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { Roles } from '../common/decorator/roles/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  // @Roles(1, 2, 3)
  // @Access(14, 'read')  // page_id = 14 (Data Pelanggan)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  // @Roles(1, 2, 3)
  // @Access(14, 'read')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Post()
  // @Roles(1, 2)
  // @Access(14, 'create')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  // @Roles(1, 2)
  // @Access(14, 'update')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  // @Roles(1, 2)
  // @Access(14, 'delete')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}