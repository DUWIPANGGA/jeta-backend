import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { ProductVariantsModule } from './product-variants/product-variants.module';
import { CartsModule } from './carts/carts.module';
import { OrdersModule } from './orders/orders.module';
import { OrderItemsModule } from './order-items/order-items.module';
import { PaymentsModule } from './payments/payments.module';
import { TrackingsModule } from './trackings/trackings.module';
import { TrackingHistoriesModule } from './tracking-histories/tracking-histories.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { ConsultationFilesModule } from './consultation-files/consultation-files.module';
import { ConsultationMaterialsModule } from './consultation-materials/consultation-materials.module';
import { CustomOrdersModule } from './custom-orders/custom-orders.module';
import { ProductionLogsModule } from './production-logs/production-logs.module';
import { SalaryLogsModule } from './salary-logs/salary-logs.module';
import { GuestModule } from './guest/guest.module';
import { StagesModule } from './stages/stages.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailModule } from './email/email.module';
import { PortofolioModule } from './portofolio/portofolio.module';
import { RolesModule } from './roles/roles.module';
import { PagesModule } from './pages/pages.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { ProjectsModule } from './projects/projects.module';
import { WorkLogsModule } from './work-logs/work-logs.module';
import { CheckoutModule } from './checkout/checkout.module';
// import { LogisticsModule } from './logistics/logistics.module';
import { LogisticsModule } from './logistics/logistics.module';

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
    CategoriesModule,
    ProductsModule,
    ProductVariantsModule,
    CartsModule,
    OrdersModule,
    OrderItemsModule,
    PaymentsModule,
    PaymentMethodsModule,
    TrackingsModule,
    TrackingHistoriesModule,
    ConsultationsModule,
    ConsultationFilesModule,
    ConsultationMaterialsModule,
    CustomOrdersModule,
    ProductionLogsModule,
    SalaryLogsModule,
    GuestModule,
    StagesModule,
    EmailModule,
    PortofolioModule,
    RolesModule,
    PagesModule,
    ProjectsModule,
    WorkLogsModule,
    CheckoutModule,
    LogisticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService
  ],
})
export class AppModule { }
