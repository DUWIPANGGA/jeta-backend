import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createProductDto: CreateProductDto, file: Express.Multer.File) {
    const imageUrl = `/uploads/products/${file.filename}`;

    const category = await this.prisma.category.findUnique({
      where: { id: createProductDto.category_id },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${createProductDto.category_id} not found`);
    }

    const product = await this.prisma.product.create({
      data: {
        category_id: createProductDto.category_id,
        name: createProductDto.name,
        description: createProductDto.description || '',
        price: createProductDto.price,
        image: imageUrl,
      },
      include: {
        category: true,
        variants: true,
      },
    });

    return {
      success: true,
      message: 'Product created successfully',
      data: product,
    };
  }

  async findAll() {
    const products = await this.prisma.product.findMany({
      include: {
        category: true,
        variants: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      success: true,
      message: 'Products retrieved successfully',
      data: products,
      total: products.length,
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
        // production_stages: {
        //   include: {
        //     stage: true,
        //     order: {
        //       select: {
        //         id: true,
        //         order_number: true,
        //       },
        //     },
        //   },
        // },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Product retrieved successfully',
      data: product,
    };
  }

  async findByCategory(categoryId: number) {
    const products = await this.prisma.product.findMany({
      where: { category_id: categoryId },
      include: {
        category: true,
        variants: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      success: true,
      message: 'Products retrieved successfully',
      data: products,
      total: products.length,
    };
  }

  async update(id: number, updateProductDto: UpdateProductDto, file?: Express.Multer.File) {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (updateProductDto.category_id) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.category_id },
      });
      if (!category) {
        throw new NotFoundException(`Category with ID ${updateProductDto.category_id} not found`);
      }
    }

    const updateData: any = { ...updateProductDto };

    if (file) {
      const oldImagePath = path.join(process.cwd(), 'uploads', 'products',
        path.basename(existingProduct.image));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      updateData.image = `/uploads/products/${file.filename}`;
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        variants: true,
      },
    });

    return {
      success: true,
      message: 'Product updated successfully',
      data: updated,
    };
  }

  async remove(id: number) {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const imagePath = path.join(process.cwd(), 'uploads', 'products',
      path.basename(existingProduct.image));
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Product with ID ${id} deleted successfully`,
    };
  }
}