import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: { id: number; role_id: number };
}

@Controller('checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) { }

  @Post()
  async processCheckout(@Body() dto: CheckoutDto, @Req() req: RequestWithUser) {
    return this.checkoutService.processCheckout(req.user.id, dto);
  }
}