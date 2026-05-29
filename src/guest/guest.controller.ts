// src/guest/guest.controller.ts
import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { GuestService } from './guest.service';
import { OrdersService } from '../orders/orders.service';

// ❌ HAPUS semua guard dan decorator yang tidak perlu
// @UseGuards(JwtAuthGuard, AccessGuard)
// @Access(13, 'read')

@Controller('guest')
export class GuestController {
  constructor(
    private readonly guestService: GuestService,
    private readonly ordersService: OrdersService,
  ) { }

  // Guest bisa lihat daftar produk
  @Get('products')
  async getAllProducts() {
    return this.guestService.getAllProducts();
  }

  // Guest bisa lihat detail produk
  @Get('products/:id')
  async getProductById(@Param('id') id: string) {
    return this.guestService.getProductById(+id);
  }

  // Guest bisa lihat daftar kategori
  @Get('categories')
  async getAllCategories() {
    return this.guestService.getAllCategories();
  }

  // Guest bisa lihat portofolio
  @Get('portofolios')
  async getAllPortofolios() {
    return this.guestService.getAllPortofolios();
  }

  // Guest bisa lihat stages (opsional)
  @Get('stages')
  async getAllStages() {
    return this.guestService.getAllStages();
  }

  // ✅ Guest bisa melacak pesanan berdasarkan nomor pesanan secara publik (tanpa login)
  @Get('track-order/:orderNumber')
  async trackOrderByNumber(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  // ✅ Guest bisa melacak pesanan kustom berdasarkan ID + Email/Telepon secara publik (aman dari IDOR)
  @Get('track-custom-order')
  async trackCustomOrder(
    @Query('id') id: string,
    @Query('contact') contact: string,
  ) {
    if (!id || !contact) {
      throw new BadRequestException('ID Pesanan dan Email/No. Telepon harus diisi.');
    }
    return this.guestService.trackCustomOrder(+id, contact);
  }
}