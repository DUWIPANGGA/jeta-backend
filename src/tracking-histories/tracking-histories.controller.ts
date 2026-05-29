import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { TrackingHistoriesService } from './tracking-histories.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@Controller('tracking-histories')
@UseGuards(JwtAuthGuard, AccessGuard)
export class TrackingHistoriesController {
  constructor(private readonly trackingHistoriesService: TrackingHistoriesService) { }

  @Post()
  @Access('TrackingHistories', 'create')
  create(@Body() createDto: { tracking_id: number; status: string }) {
    return this.trackingHistoriesService.create(createDto);
  }

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

  @Patch(':id')
  @Access('TrackingHistories', 'update')
  update(@Param('id') id: string, @Body() updateDto: { status?: string }) {
    return this.trackingHistoriesService.update(+id, updateDto);
  }

  @Delete(':id')
  @Access('TrackingHistories', 'delete')
  remove(@Param('id') id: string) {
    return this.trackingHistoriesService.remove(+id);
  }
}