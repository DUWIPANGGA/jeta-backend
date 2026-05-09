import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, ParseIntPipe } from '@nestjs/common';
import { ProgressReportsService } from './progress-reports.service';
import { CreateProgressReportDto } from './dto/create-progress-report.dto';
import { UpdateProgressReportDto } from './dto/update-progress-report.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: { id: number; role_id: number };
}

@Controller('progress-reports')
@UseGuards(JwtAuthGuard)
export class ProgressReportsController {
  constructor(private readonly service: ProgressReportsService) {}

  @Post()
  create(@Body() dto: CreateProgressReportDto, @Req() req: RequestWithUser) {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  findAll(@Query('project_id') projectId?: string) {
    return this.service.findAll(projectId ? parseInt(projectId) : undefined);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProgressReportDto,
    @Req() req: RequestWithUser,
  ) {
    const isAdmin = req.user.role_id === 1;
    return this.service.update(id, dto, req.user.id, isAdmin);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const isAdmin = req.user.role_id === 1;
    return this.service.remove(id, req.user.id, isAdmin);
  }
}