import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCarouselDto } from './dto/create-carousel.dto';
import { UpdateCarouselDto } from './dto/update-carousel.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CarouselsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateCarouselDto, file: Express.Multer.File) {
    const imageUrl = `/uploads/carousels/${file.filename}`;

    const carousel = await this.prisma.carousel.create({
      data: {
        text: createDto.text,
        title: createDto.title,
        link: createDto.link,
        image: imageUrl,
        order: createDto.order,
      },
    });

    return {
      success: true,
      message: 'Carousel created successfully',
      data: carousel,
    };
  }

  async findAll() {
    const carousels = await this.prisma.carousel.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });

    return {
      success: true,
      message: 'Carousels retrieved successfully',
      data: carousels,
    };
  }

  async findOne(id: number) {
    const carousel = await this.prisma.carousel.findUnique({
      where: { id },
    });

    if (!carousel) {
      throw new NotFoundException(`Carousel with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Carousel retrieved successfully',
      data: carousel,
    };
  }

  async update(id: number, updateDto: UpdateCarouselDto, file?: Express.Multer.File) {
    const existing = await this.prisma.carousel.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Carousel with ID ${id} not found`);
    }

    const updateData: any = { ...updateDto };

    if (file) {
      if (existing.image) {
        const oldImagePath = path.join(process.cwd(), 'uploads', 'carousels',
          path.basename(existing.image));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.image = `/uploads/carousels/${file.filename}`;
    }

    const updated = await this.prisma.carousel.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      message: 'Carousel updated successfully',
      data: updated,
    };
  }

  async remove(id: number) {
    const existing = await this.prisma.carousel.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Carousel with ID ${id} not found`);
    }

    if (existing.image) {
      const imagePath = path.join(process.cwd(), 'uploads', 'carousels',
        path.basename(existing.image));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await this.prisma.carousel.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Carousel with ID ${id} deleted successfully`,
    };
  }
}
