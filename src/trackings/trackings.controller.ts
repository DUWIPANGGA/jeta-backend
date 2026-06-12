import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { TrackingsService } from './trackings.service';
import { CreateTrackingDto } from './dto/create-tracking.dto';
import { UpdateTrackingDto } from './dto/update-tracking.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from 'src/common/guard/access/access.guard';
import { Access } from 'src/common/decorator/access/access.decorator';

@Controller('trackings')
@UseGuards(JwtAuthGuard, AccessGuard)
export class TrackingsController {
  constructor(private readonly trackingsService: TrackingsService) { }

  @Get()
  @Access('Trackings', 'read')
  findAll() {
    return this.trackingsService.findAll();
  }

  @Get('order/:orderId')
  @Access('Trackings', 'read')
  findByOrder(@Param('orderId') orderId: string) {
    return this.trackingsService.findByOrder(+orderId);
  }

  @Get('custom-order/:customOrderId')
  @Access('Trackings', 'read')
  findByCustomOrder(@Param('customOrderId') customOrderId: string) {
    return this.trackingsService.findByCustomOrder(+customOrderId);
  }

  @Get(':id')
  @Access('Trackings', 'read')
  findOne(@Param('id') id: string) {
    return this.trackingsService.findOne(+id);
  }

  @Post()
  @Access('Trackings', 'create')
  create(@Body() createDto: CreateTrackingDto) {
    return this.trackingsService.create(createDto);
  }


  @Patch(':id')
  @Access('Trackings', 'update')
  update(@Param('id') id: string, @Body() updateDto: UpdateTrackingDto) {
    return this.trackingsService.update(+id, updateDto);
  }

  @Patch(':id/stage')
  @Access('Trackings', 'update')
  updateStage(
    @Param('id') id: string,
    @Body('stage_name') stageName: string,
    @Body('progress_percentage') progressPercentage?: number,
  ) {
    return this.trackingsService.updateStage(+id, stageName, progressPercentage);
  }

  @Delete(':id')
  @Access('Trackings', 'delete')
  remove(@Param('id') id: string) {
    return this.trackingsService.remove(+id);
  }
}