import { Controller, Post, Req, Headers } from '@nestjs/common';
import { OrdersService } from 'src/orders/orders.service';
import { PaymentsService } from 'src/payments/payments.service';
import type { RequestWithRawBody } from './interface/request-with-raw-body';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('stripe')
  @Public()
  async handleStripeWebhook(@Req() req: RequestWithRawBody, @Headers('stripe-signature') signature: string) {
    // Vérifier la signature
    const event = this.paymentsService.verifyWebhook(req.rawBody,signature);
    console.log(`📨 Webhook received: ${event.type}`);
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event);
        break;

      case 'payment_intent.canceled':
        await this.handlePaymentCanceled(event);
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentSuccess(event: any) {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.order_id;
    // Confirmer le paiement et convertir réservation en vente
    await this.ordersService.confirmPayment(orderId);
  }

  private async handlePaymentFailed(event: any) {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.order_id;
    // Libérer le stock réservé
    await this.ordersService.FailedPayment(orderId);
  }

  private async handlePaymentCanceled(event: any) {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.order_id;
    await this.ordersService.cancelPayment(orderId);
  }
}
