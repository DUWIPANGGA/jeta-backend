import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ProductStatus } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private getBaseUrl(): string {
    return this.configService.get('APP_URL') || 'http://localhost:3000';
  }

  private transformProductImage(product: any) {
    if (!product) return product;
    
    const transform = (p: any) => {
      if (!p.image) return p;
      
      if (p.image.startsWith('http://') || p.image.startsWith('https://')) {
        return p;
      }
      
      return {
        ...p,
        image: `${this.getBaseUrl()}/uploads/products/${p.image}`,
      };
    };

    if (Array.isArray(product)) {
      return product.map(transform);
    }
    return transform(product);
  }

  async create(data: any, file: Express.Multer.File) {
    this.logger.log('Creating new product...');
    
    if (!file) {
      throw new BadRequestException('Product image is required');
    }
    
    try {
      // Konversi data dari string ke number
      const categoryId = Number(data.category_id);
      const price = Number(data.price);
      
      // Validasi required fields
      if (isNaN(categoryId)) {
        throw new BadRequestException('category_id must be a valid number');
      }
      
      if (!data.name || data.name.trim() === '') {
        throw new BadRequestException('Product name is required');
      }
      
      if (isNaN(price) || price <= 0) {
        throw new BadRequestException('Price must be a valid positive number');
      }
      
      // Cek apakah category exists
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        throw new BadRequestException(`Category with ID ${categoryId} not found`);
      }

      // Simpan product ke database
      const product = await this.prisma.product.create({
        data: {
          category_id: categoryId,
          name: data.name.trim(),
          description: data.description || '',
          price: price,
          image: file.filename, // Gunakan filename dari multer
          status: data.status || ProductStatus.active,
        },
        include: {
          category: true,
          variants: true,
        },
      });
      
      this.logger.log(`Product created successfully with ID: ${product.id}`);
      return this.transformProductImage(product);
      
    } catch (error) {
      // Jika error, hapus file yang sudah terupload
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        this.logger.log(`Deleted uploaded file due to error: ${file.path}`);
      }
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error creating product: ${errorMessage}`);
      throw new BadRequestException(`Failed to create product: ${errorMessage}`);
    }
  }

  async findAll() {
    try {
      const products = await this.prisma.product.findMany({
        include: {
          category: true,
          variants: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });
      
      return this.transformProductImage(products);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error fetching products: ${errorMessage}`);
      throw new BadRequestException('Failed to fetch products');
    }
  }

  async findOne(id: number) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          variants: true,
        },
      });
      
      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      
      return this.transformProductImage(product);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error finding product ${id}: ${errorMessage}`);
      throw new BadRequestException('Failed to fetch product');
    }
  }

  async update(id: number, data: any, file?: Express.Multer.File) {
    this.logger.log(`Updating product ${id}...`);
    
    try {
      // Cek apakah product exists
      const existingProduct = await this.findOne(id);
      
      // Siapkan data update
      const updateData: any = {};

      // Handle category_id
      if (data.category_id) {
        const categoryId = Number(data.category_id);
        if (isNaN(categoryId)) {
          throw new BadRequestException('category_id must be a valid number');
        }
        
        const category = await this.prisma.category.findUnique({
          where: { id: categoryId },
        });
        if (!category) {
          throw new BadRequestException(`Category with ID ${categoryId} not found`);
        }
        updateData.category_id = categoryId;
      }

      // Handle name
      if (data.name !== undefined) {
        if (!data.name || data.name.trim() === '') {
          throw new BadRequestException('Product name cannot be empty');
        }
        updateData.name = data.name.trim();
      }

      // Handle description
      if (data.description !== undefined) {
        updateData.description = data.description;
      }

      // Handle price
      if (data.price) {
        const price = Number(data.price);
        if (isNaN(price) || price <= 0) {
          throw new BadRequestException('Price must be a valid positive number');
        }
        updateData.price = price;
      }

      // Handle status
      if (data.status) {
        if (!Object.values(ProductStatus).includes(data.status)) {
          throw new BadRequestException('Invalid status value');
        }
        updateData.status = data.status;
      }

      // Handle image
      if (file) {
        // Hapus gambar lama jika bukan default
        if (existingProduct.image && existingProduct.image !== 'default-product.jpg') {
          const oldImagePath = path.join('./uploads/products', existingProduct.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
            this.logger.log(`Deleted old image: ${oldImagePath}`);
          }
        }
        
        // Gunakan filename dari multer
        updateData.image = file.filename;
        this.logger.log(`New image: ${file.filename}`);
      }

      // Jika tidak ada data yang diupdate
      if (Object.keys(updateData).length === 0) {
        throw new BadRequestException('No valid data to update');
      }

      // Update product
      const product = await this.prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          variants: true,
        },
      });
      
      this.logger.log(`Product ${id} updated successfully`);
      return this.transformProductImage(product);
      
    } catch (error) {
      // Jika error dan ada file baru, hapus file tersebut
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        this.logger.log(`Deleted uploaded file due to error: ${file.path}`);
      }
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error updating product ${id}: ${errorMessage}`);
      throw new BadRequestException('Failed to update product');
    }
  }

  async remove(id: number) {
    try {
      // Cek apakah product exists
      const product = await this.findOne(id);
      
      // Cek apakah product memiliki order items
      const orderItems = await this.prisma.orderItem.findMany({
        where: { product_id: id },
        take: 1,
      });

      if (orderItems.length > 0) {
        throw new BadRequestException(
          `Cannot delete product with ID ${id} because it has existing orders`
        );
      }
      
      // Hapus file gambar jika bukan default
      if (product.image && product.image !== 'default-product.jpg') {
        const imagePath = path.join('./uploads/products', product.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          this.logger.log(`Deleted image: ${imagePath}`);
        }
      }
      
      // Hapus product dari database
      await this.prisma.product.delete({ where: { id } });
      
      this.logger.log(`Product ${id} deleted successfully`);
      return { 
        message: `Product with ID ${id} successfully deleted`,
        statusCode: 200 
      };
      
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error deleting product ${id}: ${errorMessage}`);
      throw new BadRequestException('Failed to delete product');
    }
  }

  async findByCategory(categoryId: number) {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${categoryId} not found`);
      }

      const products = await this.prisma.product.findMany({
        where: { category_id: categoryId },
        include: {
          category: true,
          variants: true,
        },
      });
      
      return this.transformProductImage(products);
      
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error finding products by category ${categoryId}: ${errorMessage}`);
      throw new BadRequestException('Failed to fetch products by category');
    }
  }

  async updateStatus(id: number, status: ProductStatus) {
    try {
      await this.findOne(id);
      
      const product = await this.prisma.product.update({
        where: { id },
        data: { status },
        include: {
          category: true,
          variants: true,
        },
      });
      
      this.logger.log(`Product ${id} status updated to ${status}`);
      return this.transformProductImage(product);
      
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error updating status for product ${id}: ${errorMessage}`);
      throw new BadRequestException('Failed to update product status');
    }
  }
}