import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { WorkLogsService } from './work-logs.service';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';

@Controller('work-logs')
export class WorkLogsController {
  constructor(private readonly workLogsService: WorkLogsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() createDto: any) {
    // req.user might contain the authenticated user
    const userId = req.user?.id || 1; // Fallback to 1 if not properly set (depending on auth strategy)
    return this.workLogsService.create(userId, createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.workLogsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('progress/:orderType/:orderId')
  getProgress(@Param('orderType') orderType: string, @Param('orderId') orderId: string) {
    return this.workLogsService.getOrderProgress(orderType.toUpperCase(), +orderId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workLogsService.findOne(+id);
  }
}
