import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TrackingHistorysService } from './tracking-historys.service';

@Controller('tracking-historys')
export class TrackingHistorysController {
  constructor(private readonly trackingHistorysService: TrackingHistorysService) {}

  @Post()
  create(@Body() createDto: any) {
    return this.trackingHistorysService.create(createDto);
  }

  @Get()
  findAll() {
    return this.trackingHistorysService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trackingHistorysService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.trackingHistorysService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.trackingHistorysService.remove(+id);
  }
}
