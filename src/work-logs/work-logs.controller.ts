// src/work-logs/work-logs.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { WorkLogsService } from './work-logs.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

interface RequestWithUser extends Request {
  user: { id: number; role_id: number };
}

@Controller('work-logs')
@UseGuards(JwtAuthGuard, AccessGuard)
export class WorkLogsController {
  constructor(private readonly workLogsService: WorkLogsService) { }

  @Post()
  @Access(33, 'create')
  create(@Body() createDto: any, @Req() req: RequestWithUser) {
    return this.workLogsService.create(req.user.id, createDto);
  }

  @Get()
  @Access(33, 'read')
  findAll() {
    return this.workLogsService.findAll();
  }

  @Get(':id')
  @Access(33, 'read')
  findOne(@Param('id') id: string) {
    return this.workLogsService.findOne(+id);
  }

  // Method UPDATE tidak ada di service, jadi hapus dulu atau komen
  // @Patch(':id')
  // @Access(33, 'update')
  // update(@Param('id') id: string, @Body() updateDto: any) {
  //   return this.workLogsService.update(+id, updateDto);
  // }

  @Delete(':id')
  @Access(33, 'delete')
  remove(@Param('id') id: string) {
    return this.workLogsService.remove(+id);
  }
}