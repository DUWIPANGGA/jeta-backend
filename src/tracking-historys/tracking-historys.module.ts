import { Module } from '@nestjs/common';
import { TrackingHistorysService } from './tracking-historys.service';
import { TrackingHistorysController } from './tracking-historys.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TrackingHistorysController],
  providers: [TrackingHistorysService],
  exports: [TrackingHistorysService],
})
export class TrackingHistorysModule {}