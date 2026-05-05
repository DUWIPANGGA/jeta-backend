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
import { Access } from '../common/decorator/access/access.decorator';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';

@Controller('roles')
export class RoleController {
  constructor(private readonly rolesService: RolesService) { } // ← ganti ke camelCase

  @UseGuards(JwtAuthGuard)
  // @Access(17, 'read')
  @Get('pages')
  async getPages() {
    const pages = await this.rolesService.getPagesWithAccess(); // ← rolesService
    return {
      success: true,
      data: pages,
    };
  }

  @UseGuards(JwtAuthGuard)
  // @Access(17, 'read')
  @Get('pages-with-access/:roleId')
  async getPagesWithAccess(@Param('roleId') roleId: string) {
    const pages = await this.rolesService.getPagesWithAccess(parseInt(roleId));
    return {
      success: true,
      data: pages,
    };
  }

  @UseGuards(JwtAuthGuard)
  // @Access(17, 'create')
  @Post()  // ← TAMBAHKAN INI!
  async create(@Body() createRoleDto: CreateRoleDto) {
    const role = await this.rolesService.create(createRoleDto);
    return {
      success: true,
      message: 'Role created successfully',
      data: role,
    };
  }

  @UseGuards(JwtAuthGuard)
  // @Access(17, 'read')
  @Get()
  async findAll() {
    const roles = await this.rolesService.findAll();
    return {
      success: true,
      data: roles,
    };
  }

  @UseGuards(JwtAuthGuard)
  // @Access(17, 'read')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const role = await this.rolesService.findOne(parseInt(id));
    return {
      success: true,
      data: role,
    };
  }

  @UseGuards(JwtAuthGuard)
  // @Access(17, 'update')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    const role = await this.rolesService.update(parseInt(id), updateRoleDto);
    return {
      success: true,
      message: 'Role updated successfully',
      data: role,
    };
  }

  @UseGuards(JwtAuthGuard)
  // @Access(17, 'delete')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.rolesService.remove(parseInt(id));
    return {
      success: true,
      message: 'Role deleted successfully',
    };
  }
}