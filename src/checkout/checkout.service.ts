import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class CheckoutService {
  constructor(private readonly prisma: PrismaService) { }

  async processCheckout(userId: number, dto: CheckoutDto) {
    const { paymentMethodId, shippingAddress, shippingCost, cart_item_ids } = dto;

    // 1. Ambil data keranjang belanja berdasarkan pilihan user
    let cartItems;

    if (cart_item_ids && cart_item_ids.length > 0) {
      // Jika ada pilihan, ambil hanya item yang dipilih
      cartItems = await this.prisma.cart.findMany({
        where: {
          id: { in: cart_item_ids },
          user_id: userId,
        },
        include: {
          product: true,
          product_variant: {
            include: {
              size: true,
              color: true
            }
          }
        }
      });

      if (cartItems.length !== cart_item_ids.length) {
        throw new BadRequestException('Beberapa item keranjang tidak ditemukan atau bukan milik Anda');
      }
    } else {
      // Jika tidak ada pilihan, ambil semua item (backward compatible)
      cartItems = await this.prisma.cart.findMany({
        where: { user_id: userId },
        include: {
          product: true,
          product_variant: {
            include: {
              size: true,
              color: true
            }
          }
        }
      });
    }

    if (!cartItems || cartItems.length === 0) {
      throw new BadRequestException('Tidak ada item yang dipilih untuk checkout');
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
        const finalUnitPrice = basePrice + (variant.price_adjustment || 0);
        itemsTotal += finalUnitPrice * item.quantity;

        // Kurangi stok varian produk secara dinamis
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: item.quantity } }
        });

        orderItemsToCreate.push({
          product_id: item.product_id,
          variant_id: item.product_variant_id,
          quantity: item.quantity,
          price: finalUnitPrice
        });
      }

      const grandTotal = itemsTotal;
      const orderNumber = `ORD-${Date.now()}-${randomBytes(2).toString('hex').toUpperCase()}`;

      // 3. Simpan data Order baru
      const order = await prisma.order.create({
        data: {
          user_id: userId,
          order_number: orderNumber,
          grand_total: grandTotal,
          shipping_address: shippingAddress || 'N/A',
          shipping_cost: 0,
          payment_method: paymentMethod.bank_name,
          status: 'pending',
          order_items: {
            create: orderItemsToCreate
          }
        },
        include: {
          order_items: {
            include: {
              product: true,
              variant: {
                include: {
                  size: true,
                  color: true
                }
              }
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

      // 5. Hapus item keranjang yang sudah di-checkout (hanya yang dipilih)
      if (cart_item_ids && cart_item_ids.length > 0) {
        await prisma.cart.deleteMany({
          where: {
            id: { in: cart_item_ids },
            user_id: userId
          }
        });
      } else {
        // Jika checkout semua, bersihkan seluruh keranjang
        await prisma.cart.deleteMany({
          where: { user_id: userId }
        });
      }

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