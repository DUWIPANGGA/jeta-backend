import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CategorysModule } from './categorys/categorys.module';
import { ProductsModule } from './products/products.module';
import { ProductVariantsModule } from './product-variants/product-variants.module';
import { CartsModule } from './carts/carts.module';
import { CartItemsModule } from './cart-items/cart-items.module';
import { OrdersModule } from './orders/orders.module';
import { OrderItemsModule } from './order-items/order-items.module';
import { PaymentsModule } from './payments/payments.module';
import { TrackingsModule } from './trackings/trackings.module';
import { TrackingHistorysModule } from './tracking-historys/tracking-historys.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { ConsultationFilesModule } from './consultation-files/consultation-files.module';
import { ConsultationMaterialsModule } from './consultation-materials/consultation-materials.module';
import { CustomOrdersModule } from './custom-orders/custom-orders.module';
import { ProductionStagesModule } from './production-stages/production-stages.module';
import { ProductionLogsModule } from './production-logs/production-logs.module';
import { StaffsModule } from './staffs/staffs.module';
import { SalaryLogsModule } from './salary-logs/salary-logs.module';
import { GuestModule } from './guest/guest.module';
import { StagesModule } from './stages/stages.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    CategorysModule,
    ProductsModule,
    ProductVariantsModule,
    CartsModule,
    CartItemsModule,
    OrdersModule,
    OrderItemsModule,
    PaymentsModule,
    TrackingsModule,
    TrackingHistorysModule,
    ConsultationsModule,
    ConsultationFilesModule,
    ConsultationMaterialsModule,
    CustomOrdersModule,
    ProductionStagesModule,
    ProductionLogsModule,
    StaffsModule,
    SalaryLogsModule,
    GuestModule,
    StagesModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
