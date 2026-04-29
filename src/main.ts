import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser'; // 👈 TAMBAHKAN

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(cookieParser()); // 👈 TAMBAHKAN INI
  
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
    exposedHeaders: 'Content-Range, X-Content-Range',
    maxAge: 3600,
  });
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();