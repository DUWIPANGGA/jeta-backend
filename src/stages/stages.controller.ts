import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StagesService } from './stages.service';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { Roles } from '../common/decorator/roles/roles.decorator';
import { Access } from '../common/decorator/access/access.decorator';

@Controller('stages')
@UseGuards(JwtAuthGuard)
export class StagesController {
  constructor(private readonly stagesService: StagesService) { }

  @Post()
  // @Roles(1, 2)
  // @Access(11, 'create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createStageDto: CreateStageDto) {
    return this.stagesService.create(createStageDto);
  }

  @Get()
  // @Roles(1, 2, 3)
  // @Access(11, 'read')
  findAll() {
    return this.stagesService.findAll();
  }

  @Get(':id')
  // @Roles(1, 2, 3)
  // @Access(11, 'read')
  findOne(@Param('id') id: string) {
    return this.stagesService.findOne(+id);
  }

  @Patch(':id')
  // @Roles(1, 2)
  // @Access(11, 'update')
  update(@Param('id') id: string, @Body() updateStageDto: UpdateStageDto) {
    return this.stagesService.update(+id, updateStageDto);
  }

  @Patch(':id/order')
  // @Roles(1, 2)
  // @Access(11, 'update')
  updateOrder(
    @Param('id') id: string,
    @Body('order') order: number,
  ) {
    return this.stagesService.updateOrder(+id, order);
  }

  @Delete(':id')
  // @Roles(1, 2)
  // @Access(11, 'delete')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.stagesService.remove(+id);
  }
}