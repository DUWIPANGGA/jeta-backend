import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { TrackingHistoriesService } from './tracking-histories.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';
import { LogActivity } from 'src/common/decorator/activity-log/activity-log.decorator';

@Controller('tracking-histories')
@UseGuards(JwtAuthGuard, AccessGuard)
export class TrackingHistoriesController {
  constructor(private readonly trackingHistoriesService: TrackingHistoriesService) { }

  @Get()
  @Access('TrackingHistories', 'read')
  findAll() {
    return this.trackingHistoriesService.findAll();
  }

  @Get('tracking/:trackingId')
  @Access('TrackingHistories', 'read')
  findByTracking(@Param('trackingId') trackingId: string) {
    return this.trackingHistoriesService.findByTracking(+trackingId);
  }

  @Get(':id')
  @Access('TrackingHistories', 'read')
  findOne(@Param('id') id: string) {
    return this.trackingHistoriesService.findOne(+id);
  }

  @Post()
  @Access('TrackingHistories', 'create')
  @LogActivity('trackingHistory', 'create')
  create(@Body() createDto: { tracking_id: number; status: string }) {
    return this.trackingHistoriesService.create(createDto);
  }


  @Patch(':id')
  @Access('TrackingHistories', 'update')
  @LogActivity('trackingHistory', 'update')
  update(@Param('id') id: string, @Body() updateDto: { status?: string }) {
    return this.trackingHistoriesService.update(+id, updateDto);
  }

  @Delete(':id')
  @Access('TrackingHistories', 'delete')
  @LogActivity('trackingHistory', 'delete')
  remove(@Param('id') id: string) {
    return this.trackingHistoriesService.remove(+id);
  }
}