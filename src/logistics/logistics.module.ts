// src/logistics/logistics.module.ts
import { Module } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { LogisticsController } from './logistics.controller';

@Module({
  // Jika PrismaService berada di PrismaModule, jangan lupa import di sini
  // Jika PrismaService bersifat global, kamu tidak perlu menambahkannya ke imports
  controllers: [LogisticsController],
  providers: [LogisticsService],
  exports: [LogisticsService], // Export jika ingin digunakan di modul lain (misal: Orders)
})
export class LogisticsModule {}