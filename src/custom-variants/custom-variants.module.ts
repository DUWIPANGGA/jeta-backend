import { Module } from '@nestjs/common';
import { CustomVariantsService } from './custom-variants.service';
import { CustomVariantsController } from './custom-variants.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustomVariantsController],
  providers: [CustomVariantsService],
  exports: [CustomVariantsService],
})
export class CustomVariantsModule {}