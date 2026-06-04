import { Module } from '@nestjs/common';
import { CarouselsService } from './carousels.service';
import { CarouselsController } from './carousels.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CarouselsController],
  providers: [CarouselsService],
  exports: [CarouselsService],
})
export class CarouselsModule {}
