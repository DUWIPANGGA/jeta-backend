import { Module } from '@nestjs/common';
import { TrackingHistoriesService } from './tracking-histories.service';
import { TrackingHistoriesController } from './tracking-histories.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TrackingHistoriesController],
  providers: [TrackingHistoriesService],
  exports: [TrackingHistoriesService],
})
export class TrackingHistoriesModule {}