import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class CheckoutService {
  constructor(private readonly prisma: PrismaService) { }

  async processCheckout(userId: number, dto: any) {
    const { paymentMethodId, shippingAddress, shippingCost } = dto;

    // 1. Ambil data keranjang belanja aktif dari DB sebagai Source of Truth
    const cartItems = await this.prisma.cart.findMany({
      where: { user_id: userId },
      include: {
        product: true,
        product_variant: true
      }
    });

    if (!cartItems || cartItems.length === 0) {
      throw new BadRequestException('Keranjang belanja Anda kosong, tidak dapat melakukan checkout');
    }

    if (!paymentMethodId) {
      throw new BadRequestException('Metode pembayaran wajib dipilih');
    }

    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id: Number(paymentMethodId) }
    });

    if (!paymentMethod) {
      throw new BadRequestException('Metode pembayaran tidak valid');
    }

    return this.prisma.$transaction(async (prisma) => {
      let itemsTotal = 0;

      // ✅ Deklarasi array dengan tipe eksplisit (menghindari shadowing)
      const orderItemsToCreate: Array<{
        product_id: number;
        variant_id: number;
        quantity: number;
        price: number;
      }> = [];

      // 2. Validasi stok dan kalkulasi harga secara aman di Server-Side
      for (const item of cartItems) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.product_variant_id },
          include: { product: true }
        });

        if (!variant) {
          throw new BadRequestException(`Varian produk dengan ID ${item.product_variant_id} tidak ditemukan`);
        }

        if (variant.stock < item.quantity) {
          throw new BadRequestException(
            `Stok tidak mencukupi untuk ${variant.product.name || 'Produk'}. Tersedia: ${variant.stock}, diminta: ${item.quantity}`
          );
        }

        // Kalkulasi harga aman: base price produk + adjustment dari varian
        const basePrice = variant.product.price || 0;
        const finalUnitPrice = basePrice + variant.price_adjustment;
        itemsTotal += finalUnitPrice * item.quantity;

        // Kurangi stok varian produk secara dinamis
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: item.quantity } }
        });

        // ✅ Push ke outer array (menghindari shadowing)
        orderItemsToCreate.push({
          product_id: item.product_id,
          variant_id: item.product_variant_id,
          quantity: item.quantity,
          price: finalUnitPrice
        });
      }

      const grandTotal = itemsTotal + (Number(shippingCost) || 0);
      const orderNumber = `ORD-${Date.now()}-${randomBytes(2).toString('hex').toUpperCase()}`;

      // 3. Simpan data Order baru
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
            create: orderItemsToCreate  // ✅ Gunakan array yang sudah terisi
          }
        },
        include: {
          order_items: {
            include: {
              product: true,
              variant: true
            }
          }
        }
      });

      // 4. Buat Invoice Pembayaran
      const payment = await prisma.payment.create({
        data: {
          order_id: order.id,
          order_type: 'order',
          payment_method_id: Number(paymentMethodId),
          amount: grandTotal,
          payment_status: 'pending',
        }
      });

      // 5. Bersihkan keranjang belanja setelah checkout sukses
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