import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../prisma/prisma.service';
import { ACCESS_KEY, AccessOptions } from '../../decorator/access/access.decorator';

@Injectable()
export class AccessGuard implements CanActivate {
  private readonly logger = new Logger(AccessGuard.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.log('🚀 STEP 1: AccessGuard.canActivate() START');

    // ============ STEP 2: Baca metadata ============
    this.logger.log('📋 STEP 2: Reading metadata from @Access decorator...');
    const accessOptions = this.reflector.getAllAndOverride<AccessOptions>(
      ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!accessOptions) {
      this.logger.warn('⚠️ STEP 3: No @Access decorator found, skipping guard...');
      this.logger.log('✅ GUARD RESULT: Access granted (no restriction)');
      return true;
    }

    this.logger.log(`✅ STEP 3: @Access decorator found:`, accessOptions);
    this.logger.log(`   - pageIdentifier: ${accessOptions.pageIdentifier} (${typeof accessOptions.pageIdentifier})`);
    this.logger.log(`   - action: ${accessOptions.action}`);

    const { pageIdentifier, action } = accessOptions;

    // ============ STEP 4: Ambil user dari request ============
    this.logger.log('👤 STEP 4: Getting user from request...');
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    this.logger.log(`   - user object exists: ${!!user}`);
    if (user) {
      this.logger.log(`   - user.id: ${user.id}`);
      this.logger.log(`   - user.email: ${user.email || 'N/A'}`);
    }

    if (!user || !user.id) {
      this.logger.error(`   - user: ${user}`);
      this.logger.error('❌ STEP 5: User not authenticated or missing id');
      throw new UnauthorizedException('User not authenticated');
    }
    this.logger.log('✅ STEP 5: User authenticated successfully');

    // ============ STEP 6: Cari user + role di database ============
    this.logger.log(`🔍 STEP 6: Fetching user with role from database (user.id: ${user.id})...`);
    const userWithRole = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        role: true,
      },
    });

    if (!userWithRole) {
      this.logger.error(`❌ STEP 7: User with id ${user.id} not found in database`);
      throw new ForbiddenException('User not found');
    }
    this.logger.log(`✅ STEP 7: User found: ${userWithRole.email || userWithRole.id}`);

    if (!userWithRole.role) {
      this.logger.error(`❌ STEP 8: User has no role assigned! role_id: ${userWithRole.role_id || 'null'}`);
      throw new ForbiddenException('User has no role assigned');
    }

    const roleId = userWithRole.role.id;
    this.logger.log(`✅ STEP 8: User role found:`);
    this.logger.log(`   - role.id: ${roleId}`);
    this.logger.log(`   - role.name: ${userWithRole.role.name || 'N/A'}`);

    // ============ STEP 9: Tentukan page ID ============
    this.logger.log(`🔍 STEP 9: Resolving page ID from pageIdentifier: "${pageIdentifier}"`);
    let pageId: number;

    if (typeof pageIdentifier === 'number') {
      pageId = pageIdentifier;
      this.logger.log(`✅ STEP 9a: pageIdentifier is NUMBER, using directly: pageId = ${pageId}`);
    } else {
      this.logger.log(`📄 STEP 9b: pageIdentifier is STRING, searching Page by name: "${pageIdentifier}"...`);
      const page = await this.prisma.page.findFirst({
        where: { name: pageIdentifier },
      });

      if (!page) {
        this.logger.error(`❌ STEP 9c: Page with name "${pageIdentifier}" not found in database!`);
        throw new ForbiddenException(`Page "${pageIdentifier}" not found`);
      }

      pageId = page.id;
      this.logger.log(`✅ STEP 9c: Page found! id: ${page.id}, name: ${page.name}`);
    }

    // ============ STEP 10: Cari access record ============
    this.logger.log(`🔍 STEP 10: Checking access record for role_id=${roleId}, page_id=${pageId}...`);
    const access = await this.prisma.access.findFirst({
      where: {
        role_id: roleId,
        page_id: pageId,
      },
    });

    if (!access) {
      this.logger.error(`❌ STEP 11: NO access record found for role_id=${roleId}, page_id=${pageId}`);
      this.logger.error(`   This means the role has NO permission to this page at all!`);
      throw new ForbiddenException(
        `Access denied: Role does not have access to this page`,
      );
    }

    this.logger.log(`✅ STEP 11: Access record found!`);
    this.logger.log(`   - id: ${access.id}`);
    this.logger.log(`   - create: ${access.create}`);
    this.logger.log(`   - read: ${access.read}`);
    this.logger.log(`   - update: ${access.update}`);
    this.logger.log(`   - delete: ${access.delete}`);

    // ============ STEP 12: Cek permission spesifik ============
    this.logger.log(`🔍 STEP 12: Checking ${action} permission...`);
    const hasPermission = access[action];
    this.logger.log(`   - access.${action} = ${hasPermission}`);

    if (!hasPermission) {
      this.logger.error(`❌ STEP 13: Permission DENIED! User does not have "${action}" permission`);
      throw new ForbiddenException(
        `Access denied: ${action} permission required for this page`,
      );
    }
    this.logger.log(`✅ STEP 13: Permission GRANTED for action "${action}"`);

    // ============ STEP 14: Simpan ke request ============
    this.logger.log(`💾 STEP 14: Storing access info to request object...`);
    request.access = access;
    request.pageAccess = {
      canCreate: access.create,
      canRead: access.read,
      canUpdate: access.update,
      canDelete: access.delete,
    };
    this.logger.log(`   - request.pageAccess:`, request.pageAccess);

    // ============ FINAL ============
    this.logger.log(`🎉 FINAL: Access granted! Proceeding to controller...`);
    return true;
  }
}