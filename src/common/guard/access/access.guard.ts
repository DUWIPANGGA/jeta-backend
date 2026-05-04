import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../prisma/prisma.service';
import { ACCESS_KEY, AccessOptions } from '../../decorator/access/access.decorator'; // Sesuaikan juga path decorator

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const accessOptions = this.reflector.getAllAndOverride<AccessOptions>(
      ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!accessOptions) {
      return true;
    }

    const { pageIdentifier, action } = accessOptions;
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userWithRole = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        role: true,
      },
    });

    if (!userWithRole || !userWithRole.role) {
      throw new ForbiddenException('User has no role assigned');
    }

    const roleId = userWithRole.role.id;

    let pageId: number;
    
    if (typeof pageIdentifier === 'number') {
      pageId = pageIdentifier;
    } else {
      const page = await this.prisma.page.findFirst({
        where: { name: pageIdentifier },
      });
      
      if (!page) {
        throw new ForbiddenException(`Page "${pageIdentifier}" not found`);
      }
      pageId = page.id;
    }

    const access = await this.prisma.access.findFirst({
      where: {
        role_id: roleId,
        page_id: pageId,
      },
    });

    

    if (!access) {
      throw new ForbiddenException(
        `Access denied: Role does not have access to this page`,
      );
    }

    const hasPermission = access[action];
    
    if (!hasPermission) {
      throw new ForbiddenException(
        `Access denied: ${action} permission required for this page`,
      );
    }

    request.access = access;
    request.pageAccess = {
      canCreate: access.create,
      canRead: access.read,
      canUpdate: access.update,
      canDelete: access.delete,
    };

    return true;
  }
}