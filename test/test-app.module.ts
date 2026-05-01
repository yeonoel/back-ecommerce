import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from '../../config/configuration';
import { testDbConfig } from './test-db.config';
import { CategoriesModule } from '../../categories/categories.module';
import { ProductsModule } from '../../products/products.module';
import { AuthModule } from '../../auth/auth.module';
import { ProductVariantsModule } from '../../product-variants/product-variants.module';
import { CartsModule } from '../../carts/carts.module';
import { OrdersModule } from '../../orders/orders.module';
import { OrderItemsModule } from '../../order-items/order-items.module';
import { PaymentsModule } from '../../payments/payments.module';
import { ReviewsModule } from '../../reviews/reviews.module';
import { CouponsModule } from '../../coupons/coupons.module';
import { WishlistsModule } from '../../wishlists/wishlists.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { AppController } from '../../app.controller';
import { AppService } from '../../app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => (testDbConfig),
    }),
    AuthModule,
    CategoriesModule,
    ProductsModule,
    ProductsModule,
    ProductVariantsModule,
    CartsModule,
    CartsModule,
    OrdersModule,
    OrderItemsModule,
    PaymentsModule,
    ReviewsModule,
    CouponsModule,
    CouponsModule,
    WishlistsModule,
    NotificationsModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class TestAppModule { }
