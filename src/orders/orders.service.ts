import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminOrderDto } from './dto/create-admin-order.dto';
import { randomBytes } from 'crypto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) { }

  create(dto: any) {
    return this.prisma.order.create({ data: dto });
  }

  async createAdminOrder(dto: CreateAdminOrderDto, adminUserId: number) {
    const {
      user_id,
      offline_customer_name,
      offline_phone,
      offline_address,
      shipping_address,
      shipping_cost,
      payment_method_id,
      payment_status, // true = Lunas Instan di Kasir, false/undefined = pending
      items,
    } = dto;

    if (!items || items.length === 0) {
      throw new BadRequestException('Pesanan harus memiliki minimal satu item produk katalog.');
    }

    // 1. Validasi customer
    let customerId = adminUserId; // Default jika pelanggan offline
    let finalShippingAddress = shipping_address || 'Ambil di Toko';

    if (user_id) {
      const user = await this.prisma.user.findUnique({
        where: { id: user_id },
      });
      if (!user) {
        throw new NotFoundException(`Pelanggan terdaftar dengan ID ${user_id} tidak ditemukan.`);
      }
      customerId = user.id;
      if (!shipping_address) {
        finalShippingAddress = user.address || 'Ambil di Toko';
      }
    }

    // 2. Ambil metode pembayaran
    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id: payment_method_id },
    });
    if (!paymentMethod) {
      throw new NotFoundException(`Metode pembayaran dengan ID ${payment_method_id} tidak ditemukan.`);
    }

    return this.prisma.$transaction(async (tx) => {
      let itemsTotal = 0;
      const orderItemsToCreate: Array<{
        product_id: number;
        variant_id: number;
        quantity: number;
        price: number;
      }> = [];

      // 3. Validasi stok dan hitung total harga
      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.product_variant_id },
          include: { product: true },
        });

        if (!variant) {
          throw new NotFoundException(`Varian produk dengan ID ${item.product_variant_id} tidak ditemukan.`);
        }

        if (variant.stock < item.quantity) {
          throw new BadRequestException(
            `Stok tidak mencukupi untuk ${variant.product.name || 'Produk'}. Tersedia: ${variant.stock}, diminta: ${item.quantity}`,
          );
        }

        // Kurangi stok secara aman
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: item.quantity } },
        });

        const basePrice = variant.product.price || 0;
        const finalUnitPrice = basePrice + (variant.price_adjustment || 0);
        itemsTotal += finalUnitPrice * item.quantity;

        orderItemsToCreate.push({
          product_id: variant.product_id,
          variant_id: variant.id,
          quantity: item.quantity,
          price: finalUnitPrice,
        });
      }

      const grandTotal = itemsTotal;
      const orderNumber = `ORD-ADM-${Date.now()}-${randomBytes(2).toString('hex').toUpperCase()}`;

      // 4. Tentukan status awal Order & Payment berdasarkan parameter `payment_status`
      const isPaidInstantly = !!payment_status;
      const initialOrderStatus = isPaidInstantly ? 'processing' : 'pending';
      const initialPaymentStatus = isPaidInstantly ? PaymentStatus.completed : PaymentStatus.pending;

      // 5. Buat Order
      const order = await tx.order.create({
        data: {
          user_id: customerId,
          order_number: orderNumber,
          grand_total: grandTotal,
          shipping_address: finalShippingAddress,
          shipping_cost: 0,
          payment_method: paymentMethod.bank_name,
          status: initialOrderStatus as any,
          is_admin_order: true,
          offline_customer_name: user_id ? null : offline_customer_name,
          offline_phone: user_id ? null : offline_phone,
          offline_address: user_id ? null : offline_address,
          order_items: {
            create: orderItemsToCreate,
          },
        },
        include: {
          order_items: {
            include: {
              product: true,
              variant: {
                include: {
                  size: true,
                  color: true,
                },
              },
            },
          },
        },
      });

      // 6. Buat Payment
      const payment = await tx.payment.create({
        data: {
          order_id: order.id,
          order_type: 'order',
          payment_method_id: paymentMethod.id,
          amount: grandTotal,
          payment_status: initialPaymentStatus,
          paid_at: isPaidInstantly ? new Date() : null,
        },
      });

      // 7. Jika lunas instan, buat inisialisasi pelacakan pengiriman (Tracking)
      if (isPaidInstantly) {
        const tracking = await tx.tracking.create({
          data: {
            order_id: order.id,
            current_stage: 'Pembayaran Diterima',
            progress_percentage: 10,
            estimated_completion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Default 3 hari
          },
        });
        await tx.trackingHistory.create({
          data: {
            tracking_id: tracking.id,
            status: 'Pembayaran instan lunas di Kasir (diinput oleh Admin). Pesanan sedang dipersiapkan.',
          },
        });
      }

      return {
        order,
        payment,
        paymentInstructions: isPaidInstantly
          ? { message: 'Pembayaran lunas seketika di Kasir.' }
          : {
              bank: paymentMethod.bank_name,
              accountNumber: paymentMethod.bank_account,
              ownerName: paymentMethod.owner_name,
            },
      };
    });
  }

  async findByUser(userId: number, loggedInUserId: number, loggedInUserRoleId: number) {
    // 1. Dapatkan role dari pengguna yang login
    const role = await this.prisma.role.findUnique({
      where: { id: loggedInUserRoleId }
    });

    const isOwner = loggedInUserId === userId;
    const hasAdminAccess = role && ['superadmin', 'admin', 'staff', 'finance'].includes(role.name);

    if (!isOwner && !hasAdminAccess) {
      throw new ForbiddenException('Anda tidak memiliki izin untuk melihat pesanan ini.');
    }

    return this.prisma.order.findMany({
      where: { user_id: userId },
      include: {
        order_items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { size: true, color: true } }
          }
        },
        trackings: {
          include: { tracking_histories: { orderBy: { created_at: 'desc' } } }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        order_items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { size: true, color: true } }
          }
        },
        trackings: {
          include: { tracking_histories: { orderBy: { created_at: 'desc' } } }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async findOne(id: number) {
    const item = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        order_items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { size: true, color: true } }
          }
        },
        trackings: {
          include: { tracking_histories: { orderBy: { created_at: 'desc' } } }
        }
      }
    });
    if (!item) throw new NotFoundException(`Order #${id} not found`);
    return item;
  }

  async update(id: number, dto: any) {
    const order = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      // Jika status diubah menjadi 'cancelled' dan sebelumnya bukan 'cancelled'
      if (dto.status === 'cancelled' && order.status !== 'cancelled') {
        for (const item of order.order_items) {
          if (item.variant_id) {
            await tx.productVariant.update({
              where: { id: item.variant_id },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      // Jika status diubah DARI 'cancelled' menjadi status aktif kembali
      if (dto.status && dto.status !== 'cancelled' && order.status === 'cancelled') {
        for (const item of order.order_items) {
          if (item.variant_id) {
            const variant = await tx.productVariant.findUnique({
              where: { id: item.variant_id },
            });
            if (!variant || variant.stock < item.quantity) {
              throw new BadRequestException(
                `Gagal memulihkan pesanan. Stok tidak mencukupi untuk varian produk ID ${item.variant_id}.`,
              );
            }
            await tx.productVariant.update({
              where: { id: item.variant_id },
              data: { stock: { decrement: item.quantity } },
            });
          }
        }
      }

      return tx.order.update({ where: { id }, data: dto });
    });
  }

  async updateTracking(id: number, stageName: string) {
    const order = await this.findOne(id);

    if (order.status === 'cancelled') {
      throw new BadRequestException('Tidak dapat memperbarui pelacakan pengiriman untuk pesanan yang sudah dibatalkan.');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Get or create tracking record
      let tracking = await tx.tracking.findFirst({
        where: { order_id: id }
      });

      if (!tracking) {
        tracking = await tx.tracking.create({
          data: {
            order_id: id,
            current_stage: stageName,
            progress_percentage: 0,
            estimated_completion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
          }
        });
      } else {
        tracking = await tx.tracking.update({
          where: { id: tracking.id },
          data: { current_stage: stageName }
        });
      }

      // 2. Add history
      await tx.trackingHistory.create({
        data: {
          tracking_id: tracking.id,
          status: stageName
        }
      });

      // 3. Update Order Status if final stage
      const finalStages = ['Selesai', 'Diterima', 'Completed'];
      if (finalStages.includes(stageName)) {
        await tx.order.update({
          where: { id },
          data: { status: 'completed' }
        });
      } else if (order.status === 'pending') {
        await tx.order.update({
          where: { id },
          data: { status: 'processing' }
        });
      }

      return tracking;
    });
  }

  async remove(id: number) {
    const order = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      // Jika status order bukan 'cancelled', kembalikan stok terlebih dahulu sebelum dihapus
      if (order.status !== 'cancelled') {
        for (const item of order.order_items) {
          if (item.variant_id) {
            await tx.productVariant.update({
              where: { id: item.variant_id },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      await tx.order.delete({ where: { id } });
      return { message: `Order #${id} successfully deleted` };
    });
  }
}
