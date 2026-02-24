export enum OrderStatus {
  PENDING_PAYMENT = 'pending_payment',
  CONFIRMED = 'confirmed',
  PAYMENT_FAILED = 'payment_failed',
  EXPIRED = 'expired',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

/*
export enum OrderStatus {
  PENDING_CONFIRMATION = 'pending_confirmation',
  CONFIRMED_BY_CLIENT = 'confirmed_by_client',
  APPROVED_BY_SELLER = 'approved_by_seller',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}*/