import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class CheckoutService {
  constructor(private readonly prisma: PrismaService) {}

  async processCheckout(userId: number, dto: any) {
    const { items, paymentMethodId, shippingAddress, shippingCost } = dto;
    // items expected format: { productId: number, variantId: number, quantity: number, price: number }[]
    
    if (!items || !items.length) {
      throw new BadRequestException('Items are required for checkout');
    }
    if (!paymentMethodId) {
      throw new BadRequestException('Payment method is required');
    }

    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id: Number(paymentMethodId) }
    });
    
    if (!paymentMethod) {
      throw new BadRequestException('Invalid payment method');
    }

    const grandTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + (Number(shippingCost) || 0);
    const orderNumber = `ORD-${Date.now()}-${randomBytes(2).toString('hex').toUpperCase()}`;

    return this.prisma.$transaction(async (prisma) => {
      const order = await prisma.order.create({
        data: {
          user_id: userId,
          order_number: orderNumber,
          grand_total: grandTotal,
          shipping_address: shippingAddress || 'N/A',
          shipping_cost: Number(shippingCost) || 0,
          payment_method: paymentMethod.bank_name,
          status: 'pending',
          order_items: {
            create: items.map(item => ({
              product_id: Number(item.productId),
              variant_id: Number(item.variantId),
              quantity: Number(item.quantity),
              price: Number(item.price)
            }))
          }
        }
      });

      const payment = await prisma.payment.create({
        data: {
          order_id: order.id,
          order_type: 'order',
          payment_method_id: Number(paymentMethodId),
          amount: grandTotal,
          payment_status: 'pending',
        }
      });
      
      // Clear cart items for this user - Menggunakan 'cart' bukan 'cartItem' sesuai CartsService
      await prisma.cart.deleteMany({
        where: { user_id: userId }
      });

      return {
        order,
        payment,
        paymentInstructions: {
          bank: paymentMethod.bank_name,
          accountNumber: paymentMethod.bank_account,
          ownerName: paymentMethod.owner_name
        }
      };
    });
  }
}
