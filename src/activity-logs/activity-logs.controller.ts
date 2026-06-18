import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';

@Controller('activity-logs')
@UseGuards(JwtAuthGuard, AccessGuard)
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) { }

  @Get()
  @Access('ActivityLogs', 'read')
  findAll(@Query() query: QueryActivityLogDto) {
    return this.activityLogsService.findAll(query);
  }

  @Get(':id')
  @Access('ActivityLogs', 'read')
  findOne(@Param('id') id: string) {
    return this.activityLogsService.findOne(+id);
  }
}
