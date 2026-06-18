import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { ACTIVITY_LOG_KEY, LogActivityOptions } from '../decorator/activity-log/activity-log.decorator';

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.getAllAndOverride<LogActivityOptions>(
      ACTIVITY_LOG_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) return next.handle();

    const request = context.switchToHttp().getRequest();
    const method = request.method;

    if (!['POST', 'PATCH', 'DELETE'].includes(method)) return next.handle();

    const route = request.route?.path || request.url;
    const user = request.user;
    const ipAddress = request.ip || request.connection?.remoteAddress;
    const userAgent = request.headers['user-agent'] || null;
    const requestBody = ['POST', 'PATCH'].includes(method) ? request.body : null;

    const entityId = request.params?.id ? +request.params.id : null;

    const logPromise = this.captureOldValue(options.entity, entityId, method).then(
      (oldValue) => {
        return next.handle().pipe(
          tap({
            next: (responseBody) => {
              const response = context.switchToHttp().getResponse();
              const statusCode = response.statusCode;

              const resolvedEntityId =
                entityId ??
                (responseBody?.id ? +responseBody.id : null) ??
                (responseBody?.data?.id ? +responseBody.data.id : null) ??
                (responseBody?.payment_id ? +responseBody.payment_id : null) ??
                (responseBody?.[`${options.entity}_id`] ? +responseBody[`${options.entity}_id`] : null) ??
                (responseBody?.[`${options.entity}Id`] ? +responseBody[`${options.entity}Id`] : null);

              this.prisma.activityLog
                .create({
                  data: {
                    user_id: user?.id || null,
                    method,
                    route,
                    entity: options.entity,
                    entity_id: resolvedEntityId,
                    action: options.action,
                    status_code: statusCode,
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    request_body: requestBody ? JSON.stringify(requestBody) : null,
                    old_value: oldValue ? JSON.stringify(oldValue) : null,
                    new_value: responseBody ? JSON.stringify(responseBody) : null,
                  },
                })
                .catch((err) =>
                  console.error('ActivityLogInterceptor: failed to save log', err),
                );
            },
            error: (err) => {
              const response = context.switchToHttp().getResponse();
              const statusCode = response?.statusCode ?? 500;

              this.prisma.activityLog
                .create({
                  data: {
                    user_id: user?.id || null,
                    method,
                    route,
                    entity: options.entity,
                    entity_id: entityId,
                    action: options.action,
                    status_code: statusCode,
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    request_body: requestBody ? JSON.stringify(requestBody) : null,
                    old_value: oldValue ? JSON.stringify(oldValue) : null,
                    new_value: null,
                  },
                })
                .catch((e) =>
                  console.error('ActivityLogInterceptor: failed to save error log', e),
                );
            },
          }),
        );
      },
    );

    return logPromise as any;
  }

  private async captureOldValue(entity: string, entityId: number | null, method: string): Promise<any> {
    if (!entityId) return null;
    if (method === 'POST') return null;

    try {
      const record = await (this.prisma as any)[entity].findUnique({
        where: { id: entityId },
      });
      return record || null;
    } catch {
      return null;
    }
  }
}
