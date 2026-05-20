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

interface RequestWithUser extends Request {
  user: { id: number; role_id: number };
}

@Controller('projects')
@UseGuards(JwtAuthGuard, AccessGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Access(23, 'create')
  create(@Body() createDto: CreateProjectDto, @Req() req: RequestWithUser) {
    return this.projectsService.create(createDto, req.user.id);
  }

  @Get()
  @Access(23, 'read')
  findAll(@Req() req: RequestWithUser) {
    const isAdmin = req.user.role_id === 1;
    return this.projectsService.findAll(req.user.id, isAdmin);
  }

  @Get('my-tasks')
  @Access(23, 'read')
  async getMyTasks(@Req() req: RequestWithUser) {
    return this.projectsService.getMyTasks(req.user.id);
  }

  @Get('queue')
  @Access(23, 'read')
  getQueue(@Req() req: RequestWithUser) {
    const isAdmin = req.user.role_id === 1;
    return this.projectsService.getQueue(isAdmin);
  }

  @Get(':id')
  @Access(23, 'read')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const isAdmin = req.user.role_id === 1;
    return this.projectsService.findOne(id, req.user.id, isAdmin);
  }

  @Patch(':id')
  @Access(23, 'update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProjectDto,
    @Req() req: RequestWithUser,
  ) {
    const isAdmin = req.user.role_id === 1;
    return this.projectsService.update(id, updateDto, req.user.id, isAdmin);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Access(23, 'delete')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const isAdmin = req.user.role_id === 1;
    await this.projectsService.remove(id, req.user.id, isAdmin);
  }
}