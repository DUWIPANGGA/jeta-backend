// src/projects/projects.controller.ts
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
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';
import { LogActivity } from 'src/common/decorator/activity-log/activity-log.decorator';
import { PrismaService } from '../prisma/prisma.service';

interface RequestWithUser extends Request {
  user: { id: number; role_id: number };
}

@Controller('projects')
@UseGuards(JwtAuthGuard, AccessGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Access('Projects', 'create')
  @LogActivity('project', 'create')
  create(@Body() createDto: CreateProjectDto, @Req() req: RequestWithUser) {
    return this.projectsService.create(createDto, req.user.id);
  }

  @Get()
  @Access('Projects', 'read')
  async findAll(@Req() req: RequestWithUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true },
    });
    const isAdmin = user?.role?.name === 'superadmin' || user?.role?.name === 'admin';
    return this.projectsService.findAll(req.user.id, isAdmin);
  }

  @Get('my-tasks')
  @Access('Projects', 'read')
  async getMyTasks(@Req() req: RequestWithUser) {
    return this.projectsService.getMyTasks(req.user.id);
  }

  @Get('queue')
  @Access('Projects', 'read')
  async getQueue(@Req() req: RequestWithUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true },
    });
    const isAdmin = user?.role?.name === 'superadmin' || user?.role?.name === 'admin';
    return this.projectsService.getQueue(req.user.id, isAdmin);
  }

  @Get(':id')
  @Access('Projects', 'read')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true },
    });
    const isAdmin = user?.role?.name === 'superadmin' || user?.role?.name === 'admin';
    return this.projectsService.findOne(id, req.user.id, isAdmin);
  }

  @Patch(':id')
  @Access('Projects', 'update')
  @LogActivity('project', 'update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProjectDto,
    @Req() req: RequestWithUser,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true },
    });
    const isAdmin = user?.role?.name === 'superadmin' || user?.role?.name === 'admin';
    return this.projectsService.update(id, updateDto, req.user.id, isAdmin);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Access('Projects', 'delete')
  @LogActivity('project', 'delete')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true },
    });
    const isAdmin = user?.role?.name === 'superadmin' || user?.role?.name === 'admin';
    await this.projectsService.remove(id, req.user.id, isAdmin);
  }
}