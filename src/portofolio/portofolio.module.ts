import { Module } from '@nestjs/common';
import { PortofolioService } from './portofolio.service';
import { PortofolioController } from './portofolio.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PortofolioController],
  providers: [PortofolioService],
  exports: [PortofolioService],
})
export class PortofolioModule {}