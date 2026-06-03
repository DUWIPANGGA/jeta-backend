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
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateStaffUserDto } from './dto/update-staff-user.dto';
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

  // ==================== GET USER PERMISSIONS ====================
  @Get('permissions')
  async getUserPermissions(@Req() req: RequestWithUser) {
    return this.usersService.getUserPermissions(req.user.id);
  }

  // ==================== GET ALL USERS ====================
  @Get()
  @Access('Users', 'read')
  findAll(@Query('search') search?: string) {
    return this.usersService.findAll(search);
  }

  // ==================== GET STAFF WITH DETAILS ====================
  @Get('staffs')
  @Access('Users', 'read')
  async getStaffWithDetails() {
    return this.usersService.getStaffWithDetails();
  }

  // ==================== GET SINGLE STAFF DETAIL ====================
  @Get('staffs/:id')
  @Access('Users', 'read')
  async getStaffDetail(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getStaffDetail(id);
  }

  // ==================== GET CUSTOMER DETAIL WITH ORDER HISTORY ====================
  @Get('customers/:id')
  @Access('Users', 'read')
  async getCustomerDetail(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getCustomerDetail(id);
  }

  // ==================== GET USER BY ID ====================
  @Get(':id')
  @Access('Users', 'read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  // ==================== CREATE USER ====================
  @Post()
  @Access('Users', 'create')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // ==================== CREATE STAFF USER ====================
  @Post('staffs')
  @Access('Users', 'create')
  createStaff(@Body() createStaffUserDto: CreateStaffUserDto) {
    return this.usersService.createStaff(createStaffUserDto);
  }

  // ==================== UPDATE STAFF USER ====================
  @Patch('staffs/:id')
  @Access('Users', 'update')
  updateStaff(@Param('id', ParseIntPipe) id: number, @Body() updateStaffUserDto: UpdateStaffUserDto) {
    return this.usersService.updateStaff(id, updateStaffUserDto);
  }

  // ==================== UPDATE USER ====================
  @Patch(':id')
  @Access('Users', 'update')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  // ==================== DELETE USER ====================
  @Delete(':id')
  @Access('Users', 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}