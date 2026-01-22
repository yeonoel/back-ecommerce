import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ShipmentStatus } from 'src/shipments/enums/shipment-status';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendTestEmail(to: string) {
    await this.mailerService.sendMail({
      to: to,
      subject: 'Welcome to our App!',
      text: `Hello welcome aboard!`,
      html: `<b>Hello </b>, welcome aboard!`,
    });
  }

  async sendShipmentTrackingEmail(to: string , orderId: string, trackingNumber: string, trackingUrl: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Your order has been shipped 🚚',
      html: `
        <h3>Your order ${orderId} is on the way</h3>
        <p>Tracking number: <strong>${trackingNumber}</strong></p>
        <p>Tracking url: <a href="${trackingUrl}">${trackingUrl}</a></p>
      `,
    });
  }

  async sendShipmentStatusEmail(to: string, orderId: string, status: ShipmentStatus, trackingNumber?: string, trackingUrl?: string) {
    await this.mailerService.sendMail({
      to: to,
      subject: `Order update: ${status}`,
      template: 'shipment-status',
      context: {
        orderId: orderId,
        status: status,
        trackingNumber: trackingNumber,
        trackingUrl: trackingUrl,
      },});
  }
}

