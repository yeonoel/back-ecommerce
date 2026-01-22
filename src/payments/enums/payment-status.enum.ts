export enum PaymentStatus {
  PENDING_PAYMENT = 'pending_payment',        // paiement créé mais pas encore tenté
  REQUIRES_ACTION = 'requires_action', // 3D Secure / confirmation client
  PAID = 'paid',              // paiement confirmé
  PROCESSING = 'processing',  // Stripe traite le paiement
  SUCCEEDED = 'succeeded',    // paiement réussi
  FAILED = 'failed',          // paiement échoué
  CANCELLED = 'cancelled',    // annulé par le client / système
  EXPIRED = 'expired',        // paiement expiré
  REFUNDED = 'refunded',      // remboursé
}
