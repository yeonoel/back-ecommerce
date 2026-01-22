export enum ShipmentStatus {
  PENDING = 'pending',       // Créé mais pas encore expédié
  IN_TRANSIT = 'in_transit', // En cours de livraison
  DELIVERED = 'delivered',   // Livré au client
  FAILED = 'failed',         // Problème de livraison
}
