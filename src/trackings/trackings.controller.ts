import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TrackingsService } from './trackings.service';

@Controller('trackings')
export class TrackingsController {
  constructor(private readonly trackingsService: TrackingsService) {}

  @Post()
  create(@Body() createDto: any) {
    return this.trackingsService.create(createDto);
  }

  @Get()
  findAll() {
    return this.trackingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trackingsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.trackingsService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.trackingsService.remove(+id);
  }
}
