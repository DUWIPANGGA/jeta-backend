import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GuestService } from './guest.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth/jwt-auth.guard';
import { Access } from 'src/common/decorator/access/access.decorator';
import { UseGuards } from '@nestjs/common';

@UseGuards(JwtAuthGuard)
@Controller('guest')
export class GuestController {
  constructor(private readonly guestService: GuestService) { }

  @Access(8, 'create')
  @Post()
  create(@Body() createGuestDto: CreateGuestDto) {
    return this.guestService.create(createGuestDto);
  }

  @Access(8, 'read')
  @Get()
  findAll() {
    return this.guestService.findAll();
  }

  @Access(8, 'read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.guestService.findOne(+id);
  }

  @Access(8, 'update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGuestDto: UpdateGuestDto) {
    return this.guestService.update(+id, updateGuestDto);
  }

  @Access(8, 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.guestService.remove(+id);
  }
}
