import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MailerModule } from '@nestjs-modules/mailer';
import { APP_INTERCEPTOR } from '@nestjs/core';

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
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { TrackingsModule } from './trackings/trackings.module';
import { TrackingHistoriesModule } from './tracking-histories/tracking-histories.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { ConsultationFilesModule } from './consultation-files/consultation-files.module';
import { ConsultationMaterialsModule } from './consultation-materials/consultation-materials.module';
import { CustomOrdersModule } from './custom-orders/custom-orders.module';
import { ProductionLogsModule } from './production-logs/production-logs.module';
import { GuestModule } from './guest/guest.module';
import { StagesModule } from './stages/stages.module';
import { EmailModule } from './email/email.module';
import { PortofolioModule } from './portofolio/portofolio.module';
import { RolesModule } from './roles/roles.module';
import { PagesModule } from './pages/pages.module';
import { ProjectsModule } from './projects/projects.module';
import { WorkLogsModule } from './work-logs/work-logs.module';
import { CheckoutModule } from './checkout/checkout.module';
import { LogisticsModule } from './logistics/logistics.module';
import { CustomerDataModule } from './customer-data/customer-data.module';
import { ReportsModule } from './reports/reports.module';
import { ProgressReportsModule } from './progress-reports/progress-reports.module';
import { StaffsModule } from './staffs/staffs.module';
import { SalaryProjectsModule } from './salary-projects/salary-projects.module';
import { FinanceModule } from './finance/finance.module';

// Module baru untuk master data
import { SizesModule } from './sizes/sizes.module';
import { ColorsModule } from './colors/colors.module';
import { AttributesModule } from './attributes/attributes.module';
import { MaterialsModule } from './materials/materials.module';
import { CustomVariantsModule } from './custom-variants/custom-variants.module';
import { VariantOptionsModule } from './variant-options/variant-options.module';
import { JerseyTemplatesModule } from './jersey-templates/jersey-templates.module';
import { CustomJerseyModule } from './custom-jersey/custom-jersey.module';

import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { SummaryModule } from './summary/summary.module';
import { CarouselsModule } from './carousels/carousels.module';
import { RecommendedProductsModule } from './recommended-products/recommended-products.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { ActivityLogInterceptor } from './common/interceptor/activity-log.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // STATIC UPLOADS
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    // FRONTEND CLIENT
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'client', 'dist'),
      serveRoot: '/',
      exclude: ['/api*', '/uploads*'],
    }),

    // MAILER
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

    // CORE MODULES
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
    CustomerDataModule,
    ReportsModule,
    ProgressReportsModule,
    StaffsModule,
    SalaryProjectsModule,
    FinanceModule,

    // MASTER DATA MODULES (baru)
    SizesModule,
    ColorsModule,
    AttributesModule,
    MaterialsModule,
    CustomVariantsModule,
    VariantOptionsModule,
    JerseyTemplatesModule,
    CustomJerseyModule,
    SummaryModule,
    CarouselsModule,
    RecommendedProductsModule,
    ActivityLogsModule,
  ],

  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityLogInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}