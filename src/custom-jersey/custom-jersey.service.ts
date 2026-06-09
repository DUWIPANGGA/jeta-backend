import {
  Injectable,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomJerseyDto } from './dto/create-custom-jersey.dto';
import { CalculatePemainDto } from './dto/calculate-pemain.dto';

@Injectable()
export class CustomJerseyService {
  constructor(private readonly prisma: PrismaService) {}

  async calculatePemain(dto: CalculatePemainDto) {
    const grouped = dto.pemain.reduce(
      (acc, p) => {
        acc[p.ukuran_option_id] = (acc[p.ukuran_option_id] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );

    const ukuranIds = Object.keys(grouped).map(Number);
    const options = await this.prisma.variantOption.findMany({
      where: { id: { in: ukuranIds } },
      select: { id: true, name: true },
    });

    const optionMap = new Map(options.map((o) => [o.id, o.name]));

    const perUkuran = ukuranIds.map((id) => ({
      ukuran_option_id: id,
      nama: optionMap.get(id) ?? 'Unknown',
      jumlah: grouped[id],
    }));

    return {
      total: dto.pemain.length,
      per_ukuran: perUkuran,
    };
  }

  async createOrder(
    createDto: CreateCustomJerseyDto,
    user: { id: number; role_id: number },
    logoFile?: Express.Multer.File,
  ) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { role: true },
    });
    const isAdmin =
      dbUser?.role?.name === 'superadmin' || dbUser?.role?.name === 'admin';

    if (!isAdmin) {
      if (
        createDto.dp_amount !== undefined ||
        createDto.remaining_amount !== undefined ||
        createDto.total_amount !== undefined
      ) {
        throw new HttpException(
          'You are not allowed to set financial fields',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    const template = await this.prisma.jerseyTemplate.findUnique({
      where: { id: createDto.jersey_template_id },
      include: {
        combinations: {
          where: {
            color_option_id: createDto.color_option_id,
            material_option_id: createDto.material_option_id,
          },
          take: 1,
        },
      },
    });

    if (!template) {
      throw new NotFoundException(
        `Jersey template with ID ${createDto.jersey_template_id} not found`,
      );
    }

    const colorOption = await this.prisma.variantOption.findUnique({
      where: { id: createDto.color_option_id },
    });
    if (!colorOption) {
      throw new BadRequestException(
        `Color option with ID ${createDto.color_option_id} not found`,
      );
    }

    const materialOption = await this.prisma.variantOption.findUnique({
      where: { id: createDto.material_option_id },
    });
    if (!materialOption) {
      throw new BadRequestException(
        `Material option with ID ${createDto.material_option_id} not found`,
      );
    }

    const templateImage = template.image
      ? JSON.stringify([template.image])
      : null;

    const deadline = createDto.deadline;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setUTCHours(0, 0, 0, 0);
    if (deadlineDate < today) {
      throw new BadRequestException('Deadline cannot be in the past');
    }

    let logoPath: string | null = null;
    if (logoFile) {
      logoPath = `/uploads/custom-jersey/${logoFile.filename}`;
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.customOrder.create({
        data: {
          user_id: user.id,
          name: createDto.name,
          phone: createDto.phone,
          email: createDto.email,
          deadline,
          catatan_tambahan: createDto.catatan_tambahan ?? '',
          images: templateImage,
          accept_status: false,
          payment_status: false,
          dp_amount: isAdmin ? createDto.dp_amount ?? null : null,
          remaining_amount: isAdmin ? createDto.remaining_amount ?? null : null,
          total_amount: isAdmin ? createDto.total_amount ?? null : null,
        },
      });

      const dateStr = new Date(order.created_at)
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '');
      const generatedCode = `CSO-${dateStr}-${order.id.toString().padStart(4, '0')}`;
      await tx.customOrder.update({
        where: { id: order.id },
        data: { custom_order_number: generatedCode },
      });

      if (isAdmin && !createDto.total_amount && createDto.dp_amount && createDto.remaining_amount) {
        await tx.customOrder.update({
          where: { id: order.id },
          data: {
            total_amount: createDto.dp_amount + createDto.remaining_amount,
          },
        });
      }

      const orderItem = await tx.customOrderItem.create({
        data: {
          custom_order_id: order.id,
          name: createDto.name_item ?? 'Produk',
          quantity: createDto.quantity,
          remaining_quantity: createDto.quantity,
        },
      });

      await tx.customOrderItemOption.createMany({
        data: [
          {
            custom_order_item_id: orderItem.id,
            variant_option_id: createDto.color_option_id,
          },
          {
            custom_order_item_id: orderItem.id,
            variant_option_id: createDto.material_option_id,
          },
        ],
      });

      if (createDto.team_name || logoPath || (createDto.pemain && createDto.pemain.length > 0)) {
        const timJersey = await tx.timJersey.create({
          data: {
            custom_order_id: order.id,
            team_name: createDto.team_name ?? null,
            logo: logoPath,
          },
        });

        if (createDto.pemain && createDto.pemain.length > 0) {
          await tx.pemain.createMany({
            data: createDto.pemain.map((p) => ({
              tim_jersey_id: timJersey.id,
              name: p.name,
              nomor_punggung: p.nomor_punggung,
              ukuran_option_id: p.ukuran_option_id,
            })),
          });
        }
      }

      return tx.customOrder.findUnique({
        where: { id: order.id },
        include: {
          tim_jersey: {
            include: { pemains: true },
          },
          items: {
            include: {
              selected_options: {
                include: { variant_option: { include: { custom_variant: true } } },
              },
            },
          },
        },
      });
    });
  }
}
