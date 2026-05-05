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
import { Roles } from '../common/decorator/roles/roles.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RoleController {
  constructor(private readonly rolesService: RolesService) { }

  @Get('pages')
  // @Roles(1, 2)
  // @Access(2, 'read')  // page_id = 2 (Akses Role)
  async getPages() {
    const pages = await this.rolesService.getPagesWithAccess();
    return {
      success: true,
      data: pages,
    };
  }

  @Get('pages-with-access/:roleId')
  // @Roles(1, 2)
  // @Access(2, 'read')
  async getPagesWithAccess(@Param('roleId') roleId: string) {
    const pages = await this.rolesService.getPagesWithAccess(parseInt(roleId));
    return {
      success: true,
      data: pages,
    };
  }

  @Post()
  // @Roles(1, 2)
  // @Access(2, 'create')
  async create(@Body() createRoleDto: CreateRoleDto) {
    const role = await this.rolesService.create(createRoleDto);
    return {
      success: true,
      message: 'Role created successfully',
      data: role,
    };
  }

  @Get()
  // @Roles(1, 2)
  // @Access(2, 'read')
  async findAll() {
    const roles = await this.rolesService.findAll();
    return {
      success: true,
      data: roles,
    };
  }

  @Get(':id')
  // @Roles(1, 2)
  // @Access(2, 'read')
  async findOne(@Param('id') id: string) {
    const role = await this.rolesService.findOne(parseInt(id));
    return {
      success: true,
      data: role,
    };
  }

  @Patch(':id')
  // @Roles(1, 2)
  // @Access(2, 'update')
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    const role = await this.rolesService.update(parseInt(id), updateRoleDto);
    return {
      success: true,
      message: 'Role updated successfully',
      data: role,
    };
  }

  @Delete(':id')
  // @Roles(1, 2)
  // @Access(2, 'delete')
  async remove(@Param('id') id: string) {
    await this.rolesService.remove(parseInt(id));
    return {
      success: true,
      message: 'Role deleted successfully',
    };
  }
}