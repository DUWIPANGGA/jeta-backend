import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        console.log('=== REQUEST HEADERS ===');
        console.log('Authorization:', req.headers.authorization);
        console.log('Cookie:', req.headers.cookie);
        console.log('Origin:', req.headers.origin);
        console.log('Full headers:', req.headers);
        next();
    }
}