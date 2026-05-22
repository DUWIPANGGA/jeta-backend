// src/customer-data/customer-data.controller.ts
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';
import { CustomerDataService } from './customer-data.service';

interface RequestWithUser extends Request {
  user: { id: number; role_id: number };
}

@Controller('customer-data')
@UseGuards(JwtAuthGuard, AccessGuard)
export class CustomerDataController {
  constructor(private readonly customerDataService: CustomerDataService) { }

  @Get('me')
  @Access('CustomerData', 'read')
  async getMyPurchases(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    const data = await this.customerDataService.getCustomerPurchaseHistory(userId);
    return {
      message: 'Customer purchase history retrieved successfully',
      data,
    };
  }
}