import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { StagesService } from './stages.service';

@Controller('stages')
export class StagesController {
  constructor(private readonly stagesService: StagesService) {}

  @Post()
  create(@Body() createDto: any) {
    return this.stagesService.create(createDto);
  }

  @Get()
  findAll() {
    return this.stagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stagesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.stagesService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stagesService.remove(+id);
  }
}
