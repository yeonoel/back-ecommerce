
export const BusinessConstants = {
  /**
   * TVA (Taxe sur la Valeur Ajoutée)
   */
  TAX: {
    RATE: 0.20,
    LABEL: 'TVA (20%)',
  },

  /**
   * Règles de livraison
   */
  SHIPPING: {
    FREE_SHIPPING_THRESHOLD: 0,
    STANDARD_COST: 0,
    EXPRESS_COST: 12.99,
  },

  /**
   * Règles de réduction
   */
  DISCOUNT: {
    MAX_PERCENTAGE: 100,
    MIN_PERCENTAGE: 0,
  },

  /**
   * Stock
   */
  STOCK: {
    LOW_STOCK_THRESHOLD: 5,
    OUT_OF_STOCK: 0,
  },

  /**
   * Panier
   */
  CART: {
    MAX_QUANTITY_PER_ITEM: 99,
    EXPIRATION_DAYS: 30,
  },

  /**
   * Commandes
   */
  ORDER: {
    NUMBER_PREFIX: 'ORD',
    NUMBER_YEAR_FORMAT: 'YYYY',
    CANCEL_ALLOWED_STATUSES: ['pending', 'confirmed'],
  },
} as const;