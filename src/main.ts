import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
const app = await NestFactory.create<NestExpressApplication>(AppModule, {
  logger: ['error', 'warn', 'log'],
});
app.set('trust proxy', true);
  app.use(cookieParser());
  
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
    exposedHeaders: 'Content-Range, X-Content-Range',
    maxAge: 3600,
  });
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  
  // ✅ PASTIKAN listen di '0.0.0.0' agar bisa diakses dari laptop lain
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`Server running on ${process.env.APP_URL ?? 'http://192.168.1.36:3000'}`);
}
bootstrap();