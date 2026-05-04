import { SetMetadata } from '@nestjs/common';
// import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Number[]) => SetMetadata(ROLES_KEY, roles);