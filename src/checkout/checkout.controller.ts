import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';
import { AccessGuard } from '../common/guard/access/access.guard';
import { Access } from '../common/decorator/access/access.decorator';
import { LogActivity } from '../common/decorator/activity-log/activity-log.decorator';

interface RequestWithUser extends Request {
  user: { id: number; role_id: number };
}

@Controller('checkout')
@UseGuards(JwtAuthGuard, AccessGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) { }

  @Post()
  @Access('Orders', 'create')
  @LogActivity('checkout', 'create')
  async processCheckout(@Body() dto: CheckoutDto, @Req() req: RequestWithUser) {
    return this.checkoutService.processCheckout(req.user.id, dto);
  }
}