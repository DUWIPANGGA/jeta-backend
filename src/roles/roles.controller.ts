// src/roles/roles.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';
import { LogActivity } from 'src/common/decorator/activity-log/activity-log.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard, AccessGuard)
export class RoleController {
  constructor(private readonly rolesService: RolesService) { }

  @Get('pages')
  @Access('Roles', 'read')
  async getPages() {
    const pages = await this.rolesService.getPagesWithAccess();
    return {
      success: true,
      data: pages,
    };
  }

  @Get('pages-with-access/:roleId')
  @Access('Roles', 'read')
  async getPagesWithAccess(@Param('roleId') roleId: string) {
    const pages = await this.rolesService.getPagesWithAccess(parseInt(roleId));
    return {
      success: true,
      data: pages,
    };
  }

  @Post()
  @Access('Roles', 'create')
  @LogActivity('role', 'create')
  async create(@Body() createRoleDto: CreateRoleDto) {
    console.log('📦 Received body:', JSON.stringify(createRoleDto, null, 2));
    const role = await this.rolesService.create(createRoleDto);
    return {
      success: true,
      message: 'Role created successfully',
      data: role,
    };
  }

  @Get()
  @Access('Roles', 'read')
  async findAll() {
    const roles = await this.rolesService.findAll();
    return {
      success: true,
      data: roles,
    };
  }

  @Get(':id')
  @Access('Roles', 'read')
  async findOne(@Param('id') id: string) {
    const role = await this.rolesService.findOne(parseInt(id));
    return {
      success: true,
      data: role,
    };
  }

  @Patch(':id')
  @Access('Roles', 'update')
  @LogActivity('role', 'update')
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    const role = await this.rolesService.update(parseInt(id), updateRoleDto);
    return {
      success: true,
      message: 'Role updated successfully',
      data: role,
    };
  }

  @Delete(':id')
  @Access('Roles', 'delete')
  @LogActivity('role', 'delete')
  async remove(@Param('id') id: string) {
    await this.rolesService.remove(parseInt(id));
    return {
      success: true,
      message: 'Role deleted successfully',
    };
  }
}