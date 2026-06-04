import { Module } from '@nestjs/common';
import { RecommendedProductsService } from './recommended-products.service';
import { RecommendedProductsController } from './recommended-products.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RecommendedProductsController],
  providers: [RecommendedProductsService],
  exports: [RecommendedProductsService],
})
export class RecommendedProductsModule {}
