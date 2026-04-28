import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: any) {
    return this.prisma.user.create({ data: dto });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: number) {
    const item = await this.prisma.user.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`User #${id} not found`);
    return item;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByVerificationToken(token: string) {
    return this.prisma.user.findUnique({ where: { verification_token: token } });
  }

  async markEmailAsVerified(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: {
        email_verified_at: new Date(),
        verification_token: null,
      },
    });
  }


  async update(id: number, dto: any, requester: any) {
    const targetUser = await this.findOne(id);

    // Superadmin can do anything
    if (requester.role === 'superadmin') {
      return this.prisma.user.update({ where: { id }, data: dto });
    }

    // Admin can change non-admins (pic, customer)
    if (requester.role === 'admin') {
      if (targetUser.role === 'admin' || targetUser.role === 'superadmin') {
        throw new ForbiddenException('Admin cannot modify other admins or superadmins');
      }
      return this.prisma.user.update({ where: { id }, data: dto });
    }

    // Regular users can only change themselves
    if (requester.sub === id) {
      return this.prisma.user.update({ where: { id }, data: dto });
    }

    throw new ForbiddenException('You do not have permission to modify this user');
  }


  async remove(id: number, requester: any) {
    const targetUser = await this.findOne(id);

    // Superadmin can do anything
    if (requester.role === 'superadmin') {
      await this.prisma.user.delete({ where: { id } });
      return { message: `User #${id} successfully deleted` };
    }

    // Admin can delete non-admins
    if (requester.role === 'admin') {
      if (targetUser.role === 'admin' || targetUser.role === 'superadmin') {
        throw new ForbiddenException('Admin cannot delete other admins or superadmins');
      }
      await this.prisma.user.delete({ where: { id } });
      return { message: `User #${id} successfully deleted` };
    }

    // Users can delete themselves (if allowed)
    if (requester.sub === id) {
      await this.prisma.user.delete({ where: { id } });
      return { message: `User #${id} successfully deleted` };
    }

    throw new ForbiddenException('You do not have permission to delete this user');
  }

}
