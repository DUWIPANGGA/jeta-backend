import { Module } from '@nestjs/common';
import { JerseyTemplatesService } from './jersey-templates.service';
import { JerseyTemplatesController } from './jersey-templates.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [JerseyTemplatesController],
  providers: [JerseyTemplatesService],
  exports: [JerseyTemplatesService],
})
export class JerseyTemplatesModule {}
