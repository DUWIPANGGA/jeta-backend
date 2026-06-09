import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JerseyTemplatesService } from './jersey-templates.service';
import { CreateJerseyTemplateDto } from './dto/create-jersey-template.dto';
import { UpdateJerseyTemplateDto } from './dto/update-jersey-template.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';

@Controller('jersey-templates')
@UseGuards(JwtAuthGuard, AccessGuard)
export class JerseyTemplatesController {
  constructor(private readonly jerseyTemplatesService: JerseyTemplatesService) {}

  @Post()
  @Access('JerseyTemplates', 'create')
  create(@Body() createDto: CreateJerseyTemplateDto) {
    return this.jerseyTemplatesService.create(createDto);
  }

  @Get()
  async findAll(@Query('include_inactive') includeInactive?: string) {
    const includeInactiveBool = includeInactive === 'false' ? false : true;
    return this.jerseyTemplatesService.findAll(includeInactiveBool);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jerseyTemplatesService.findOne(id);
  }

  @Patch(':id')
  @Access('JerseyTemplates', 'update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateJerseyTemplateDto,
  ) {
    return this.jerseyTemplatesService.update(id, updateDto);
  }

  @Delete(':id')
  @Access('JerseyTemplates', 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.jerseyTemplatesService.remove(id);
  }
}
