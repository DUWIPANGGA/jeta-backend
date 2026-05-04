import { SetMetadata } from '@nestjs/common';

export const ACCESS_KEY = 'access';

export interface AccessOptions {
  pageIdentifier: number | string;
  action: 'create' | 'read' | 'update' | 'delete';
}

export const Access = (pageIdentifier: number | string, action: 'create' | 'read' | 'update' | 'delete') => {
  return SetMetadata(ACCESS_KEY, { pageIdentifier, action });
};

export { AccessGuard } from '../../guard/access/access.guard';