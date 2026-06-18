import { SetMetadata } from '@nestjs/common';

export const ACTIVITY_LOG_KEY = 'activity_log';

export interface LogActivityOptions {
  entity: string;
  action: string;
}

export const LogActivity = (entity: string, action: string) => {
  return SetMetadata(ACTIVITY_LOG_KEY, { entity, action } as LogActivityOptions);
};
