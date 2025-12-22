import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from '../src/config/configuration';
import { testDbConfig } from './test-db.config';
import { CategoriesModule } from '../src/categories/categories.module';
import { ProductsModule } from '../src/products/products.module';
import { UsersModule } from '../src/users/users.module';
import { ProductVariantsModule } from '../src/product-variants/product-variants.module';
import { CartsModule } from '../src/carts/carts.module';
import { OrdersModule } from '../src/orders/orders.module';
import { OrderItemsModule } from '../src/order-items/order-items.module';
import { PaymentsModule } from '../src/payments/payments.module';
import { ReviewsModule } from '../src/reviews/reviews.module';
import { CouponsModule } from '../src/coupons/coupons.module';
import { WishlistsModule } from '../src/wishlists/wishlists.module';
import { NotificationsModule } from '../src/notifications/notifications.module';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
      load: [ configuration ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => (testDbConfig),
    }),
    UsersModule,
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
export class TestAppModule {}
