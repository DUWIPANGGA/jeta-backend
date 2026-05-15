// src/common/decorator/access/access.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ACCESS_KEY = 'access';

export interface AccessOptions {
    pageIdentifier: number | string; // bisa page_id atau page_name
    action: 'create' | 'read' | 'update' | 'delete';
}

export const Access = (pageIdentifier: number | string, action: 'create' | 'read' | 'update' | 'delete') =>
    SetMetadata(ACCESS_KEY, { pageIdentifier, action });