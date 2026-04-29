import { Module, forwardRef } from '@nestjs/common';
import { CartItemsService } from './cart-items.service';
import { CartItemsController } from './cart-items.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [CartItemsController],
  providers: [CartItemsService],
  exports: [CartItemsService],
})
export class CartItemsModule {}