import { Module } from '@nestjs/common';
import { TrackingHistorysService } from './tracking-historys.service';
import { TrackingHistorysController } from './tracking-historys.controller';

@Module({
  controllers: [TrackingHistorysController],
  providers: [TrackingHistorysService],
  exports: [TrackingHistorysService],
})
export class TrackingHistorysModule {}
