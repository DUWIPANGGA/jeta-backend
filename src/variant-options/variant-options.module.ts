import { Module } from '@nestjs/common';
import { VariantOptionsService } from './variant-options.service';
import { VariantOptionsController } from './variant-options.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VariantOptionsController],
  providers: [VariantOptionsService],
  exports: [VariantOptionsService],
})
export class VariantOptionsModule {}