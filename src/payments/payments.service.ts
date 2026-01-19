import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Payment } from './entities/payment.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/orders/entities/order.entity';
import Stripe from 'stripe';
import { stripeConfig } from 'src/config/stripe-config';
import { PaymentStatus } from './enums/payment-status.enum';
import { PaymentMethodType } from './enums/payment-method-type.enum';
import { currencyTypes } from '../common/enums/currency-type.enum';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  constructor(
        @InjectRepository(Payment)
        private readonly paymentsRepository: Repository<Payment>,
        @InjectRepository(Order)
        private readonly ordersRepository: Repository<Order>,
  ) {
    this.stripe = new Stripe(stripeConfig.apiKey, {
      apiVersion: '2025-12-15.clover' 
    });
  }
   /**
   * créer un Payment Intent Stripe pour une commande
   * @param orderId l'ID de la commande
   * @param userId l'ID de l'utilisateur
   * 
   */
  async createPaymentIntent(orderId: string, userId: string): Promise<{ clientSecret: string; paymentId: string }> {
    // Récupérer la commande
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, user: { id: userId } },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.paymentStatus !== PaymentStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Order is not pending payment');
    }
    // Créer le Payment Intent chez Stripe
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // Convertir en centimes
      currency: 'eur',
      metadata: {
        order_id: order.id,
        order_number: order.orderNumber,
        user_id: userId,
      },
      automatic_payment_methods: {
        enabled: true, // Permet CB, Google Pay, Apple Pay, etc.
      },
    });
    if (!paymentIntent.client_secret) {
      throw new BadRequestException('Failed to create payment intent');
    }
    // Créer le Payment dans notre BDD
    const payment = await this.paymentsRepository.save({
      order: order,
      amount: order.total,
      currency: currencyTypes.EUR,
      paymentMethod: PaymentMethodType.CARD,
      paymentProvider: 'stripe',
      transactionId: paymentIntent.id,
      status: PaymentStatus.PENDING_PAYMENT,
      metadata: {
        order_id: order.id,
        order_number: order.orderNumber,
        user_id: userId,},
    });

    // Retourner le client_secret pour le frontend
    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
    };
  }

  /**
   * vérifier le webhook Stripe
   * @param rawBody le corps du webhook brut
   * @param signature la signature du webhook
   * @return l'événement Stripe validé
   */
  verifyWebhook(rawBody: Buffer, signature: string): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        stripeConfig.webhookSecret,
      );
    } catch (error) {
      throw new BadRequestException(`Webhook signature verification failed: ${error.message}`);
    }
  }

  /**
   * TRAITER LE WEBHOOK payment_intent.succeeded
   * @param paymentIntentId l'ID du Payment Intent Stripe
   */
  async handlePaymentSuccess(paymentIntentId: string): Promise<Order | void> {
    // Sera appelé par le webhook controller
    const payment = await this.paymentsRepository.findOne({
      where: { transactionId: paymentIntentId },
      relations: ['order'],
    });
    if (!payment) {
      console.error(`Payment not found for intent: ${paymentIntentId}`);
      return;
    }
    // Mettre à jour le payment
    payment.status = PaymentStatus.SUCCEEDED;
    await this.paymentsRepository.save(payment);
    return payment.order;
  }

  /**
   * TRAITER LE WEBHOOK payment_intent.payment_failed
   * @param paymentIntentId l'ID du Payment Intent Stripe
   */
  async handlePaymentFailed(paymentIntentId: string): Promise<Order | void> {
    const payment = await this.paymentsRepository.findOne({
      where: { transactionId: paymentIntentId },
      relations: ['order'],
    });
    if (!payment) {
      throw new NotFoundException(`Payment not found for intent: ${paymentIntentId}`);
    }
    payment.status = PaymentStatus.FAILED;
    await this.paymentsRepository.save(payment);
    return payment.order;
  }
}