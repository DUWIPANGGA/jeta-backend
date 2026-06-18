import { Module } from '@nestjs/common';
import { HalamanController } from './halaman.controller';
import { HalamanService } from './halaman.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [HalamanController],
  providers: [HalamanService, PrismaService],
  exports: [HalamanService],
})
export class HalamanModule {}
