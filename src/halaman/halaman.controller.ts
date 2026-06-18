import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { HalamanService } from './halaman.service';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';

@Controller('halaman')
@UseGuards(JwtAuthGuard, AccessGuard)
export class HalamanController {
  constructor(private readonly halamanService: HalamanService) {}

  @Get()
  findAll() {
    return this.halamanService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.halamanService.findOne(+id);
  }

  @Post()
  @Access('Roles', 'create')
  create(@Body() body: any) {
    return this.halamanService.create(body);
  }

  @Patch(':id')
  @Access('Roles', 'update')
  update(@Param('id') id: string, @Body() body: any) {
    return this.halamanService.update(+id, body);
  }

  @Delete(':id')
  @Access('Roles', 'delete')
  remove(@Param('id') id: string) {
    return this.halamanService.remove(+id);
  }
}
