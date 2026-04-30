import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { join } from 'path'; // Tambahkan ini untuk static files

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  
  // Serve static files from uploads directory (AGAR GAMBAR BISA DIAKSES)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/', // URL prefix untuk mengakses file
  });
  
  // Trust proxy untuk reverse proxy (Nginx, etc)
  app.set('trust proxy', true);
  
  // Cookie parser middleware
  app.use(cookieParser());
  
  // CORS configuration
  app.enableCors({
    origin: true, // Allow all origins (for development)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],
    exposedHeaders: 'Content-Range, X-Content-Range',
    maxAge: 3600,
  });
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      transform: true, // Automatically transform payload to DTO
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
    }),
  );
  
  // Global prefix (optional - uncomment if needed)
  // app.setGlobalPrefix('api');
  
  // Listen on all network interfaces
  const port = process.env.PORT ?? 3000;
  const host = '0.0.0.0'; // Bind to all network interfaces
  
  await app.listen(port, host);
  
  // Get the actual URL after listening
  const serverUrl = await app.getUrl();
  const appUrl = process.env.APP_URL || `http://localhost:${port}`;
  
  console.log(`🚀 Server is running on:`);
  console.log(`   - Local:   ${appUrl}`);
  console.log(`   - Network: ${serverUrl.replace('[::1]', 'localhost')}`);
  console.log(`   - Port:    ${port}`);
  console.log(`   - Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   - Uploads: ${appUrl}/uploads/`);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

bootstrap();