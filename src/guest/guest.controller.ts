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

  // Guest bisa lihat recommended products
  @Get('recommended-products')
  async getRecommendedProducts() {
    return this.guestService.getRecommendedProducts();
  }

  // ✅ Guest bisa melacak pesanan (katalog maupun kustom) menggunakan satu API terpadu
  @Get('track/:code')
  async trackOrder(@Param('code') code: string) {
    return this.guestService.trackOrder(code);
  }
}