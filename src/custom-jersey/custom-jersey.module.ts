import { Module } from '@nestjs/common';
import { CustomJerseyService } from './custom-jersey.service';
import { CustomJerseyController } from './custom-jersey.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustomJerseyController],
  providers: [CustomJerseyService],
  exports: [CustomJerseyService],
})
export class CustomJerseyModule {}
