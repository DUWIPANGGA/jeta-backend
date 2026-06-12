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
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { JerseyTemplatesService } from './jersey-templates.service';
import { CreateJerseyTemplateDto } from './dto/create-jersey-template.dto';
import { UpdateJerseyTemplateDto } from './dto/update-jersey-template.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';

const uploadDir = './uploads/jersey-templates';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@Controller('jersey-templates')
@UseGuards(JwtAuthGuard, AccessGuard)
export class JerseyTemplatesController {
  constructor(private readonly jerseyTemplatesService: JerseyTemplatesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image', { storage }))
  @Access('JerseyTemplates', 'create')
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDto: CreateJerseyTemplateDto,
  ) {
    if (file) {
      createDto.image = `/uploads/jersey-templates/${file.filename}`;
    }
    return this.jerseyTemplatesService.create(createDto);
  }

  @Get()
  @Access('JerseyTemplates', 'read')
  async findAll(@Query('include_inactive') includeInactive?: string) {
    const includeInactiveBool = includeInactive === 'false' ? false : true;
    return this.jerseyTemplatesService.findAll(includeInactiveBool);
  }

  @Get(':id')
  @Access('JerseyTemplates', 'read')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jerseyTemplatesService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', { storage }))
  @Access('JerseyTemplates', 'update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateDto: UpdateJerseyTemplateDto,
  ) {
    if (file) {
      updateDto.image = `/uploads/jersey-templates/${file.filename}`;
    }
    return this.jerseyTemplatesService.update(id, updateDto);
  }

  @Delete(':id')
  @Access('JerseyTemplates', 'delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.jerseyTemplatesService.remove(id);
  }
}
