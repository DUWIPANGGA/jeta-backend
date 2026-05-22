import { Controller, Get, UseGuards } from '@nestjs/common';
import { SummaryService } from './summary.service';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';

@Controller('summary')
@UseGuards(JwtAuthGuard, AccessGuard)
export class SummaryController {
  constructor(private readonly summaryService: SummaryService) {}

  @Get('stats')
  @Access('Summary', 'read') // Page ID 53 untuk Summary
  async getStats() {
    return this.summaryService.getStats();
  }
}