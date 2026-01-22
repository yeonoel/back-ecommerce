import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { OrdersModule } from 'src/orders/orders.module';
import { PaymentsModule } from 'src/payments/payments.module';

@Module({
  imports: [OrdersModule, PaymentsModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
