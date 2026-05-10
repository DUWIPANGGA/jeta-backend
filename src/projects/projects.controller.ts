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

interface RequestWithUser extends Request {
  user: { id: number; role_id: number };
}

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() createDto: CreateProjectDto, @Req() req: RequestWithUser) {
    return this.projectsService.create(createDto, req.user.id);
  }

  @Get()
  findAll(@Req() req: RequestWithUser) {
    const isAdmin = req.user.role_id === 1;
    return this.projectsService.findAll(req.user.id, isAdmin);
  }

  @Get('my-tasks')
  async getMyTasks(@Req() req: RequestWithUser) {
    return this.projectsService.getMyTasks(req.user.id);
  }

  @Get('queue')
  getQueue(@Req() req: RequestWithUser) {
    const isAdmin = req.user.role_id === 1;
    return this.projectsService.getQueue(isAdmin);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const isAdmin = req.user.role_id === 1;
    return this.projectsService.findOne(id, req.user.id, isAdmin);
  }

  @Patch(':id')
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
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const isAdmin = req.user.role_id === 1;
    await this.projectsService.remove(id, req.user.id, isAdmin);
  }
}