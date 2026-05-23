import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@Injectable()
export class CartsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateCartDto) {
    const { product_id, product_variant_id, quantity = 1 } = dto;

    // 1. Validasi keberadaan produk & varian
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: product_variant_id },
      include: { product: true }
    });

    if (!variant || variant.product_id !== product_id) {
      throw new BadRequestException('Produk atau varian tidak cocok / tidak ditemukan.');
    }

    if (variant.stock <= 0) {
      throw new BadRequestException('Stok produk sedang habis.');
    }

    // 2. Logika Upsert: Cek jika barang sudah ada di keranjang user
    const existingCartItem = await this.prisma.cart.findFirst({
      where: {
        user_id: userId,
        product_variant_id: product_variant_id
      }
    });

    if (existingCartItem) {
      // Increment kuantitas
      const newQuantity = existingCartItem.quantity + quantity;
      if (variant.stock < newQuantity) {
        throw new BadRequestException(`Stok tidak mencukupi untuk menambah kuantitas. Tersedia: ${variant.stock}`);
      }
      return this.prisma.cart.update({
        where: { id: existingCartItem.id },
        data: { quantity: newQuantity }
      });
    }

    // Jika belum ada, buat baru
    if (variant.stock < quantity) {
      throw new BadRequestException(`Stok tidak mencukupi. Tersedia: ${variant.stock}`);
    }

    return this.prisma.cart.create({
      data: {
        user_id: userId,
        product_id: product_id,
        product_variant_id: product_variant_id,
        quantity: quantity
      }
    });
  }

  findAll(userId: number) {
    return this.prisma.cart.findMany({
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

  async findOne(userId: number, id: number) {
    const item = await this.prisma.cart.findFirst({
      where: { id, user_id: userId },
      include: {
        product: true,
        product_variant: true
      }
    });
    if (!item) throw new NotFoundException(`Keranjang belanja #${id} tidak ditemukan atau bukan milik Anda`);
    return item;
  }

  async update(userId: number, id: number, dto: UpdateCartDto) {
    const item = await this.findOne(userId, id);
    
    // Validasi stok jika kuantitas di-update
    if (dto.quantity) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.product_variant_id }
      });
      if (!variant || variant.stock < dto.quantity) {
        throw new BadRequestException(`Stok tidak mencukupi. Tersedia: ${variant?.stock || 0}`);
      }
    }

    return this.prisma.cart.update({
      where: { id },
      data: dto
    });
  }

  async remove(userId: number, id: number) {
    await this.findOne(userId, id);
    await this.prisma.cart.delete({ where: { id } });
    return { message: `Item keranjang #${id} berhasil dihapus` };
  }
}
