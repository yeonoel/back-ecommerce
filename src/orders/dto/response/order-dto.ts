import { UserDataDto } from "src/auth/dto/Users-response";
import { OrderItemDto } from "src/order-items/dto/order-item.dto";
import { PaymentStatus } from "src/payments/enums/payment-status.enum";

export class OrderDto {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  paymentStatus: PaymentStatus;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  couponCode?: string;
  customerNote?: string;
  items: OrderItemDto[];
  user: UserDataDto;
  itemsCount: number;
  shippingAddress: any;
  billingAddress: any;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
}