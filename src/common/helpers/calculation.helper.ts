import { CartItem } from "src/cart-items/entities/cart-item.entity";
import { BusinessConstants } from "../constants/businness.constant";

/**
 * Helper pour manipuler les montants
 */
export class CalculationHelper {
  /**
   * Arrondir à 2 décimales
   * Évite les problèmes de précision JavaScript
   */
  static roundToTwoDecimals(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  /**
   * Calculer un pourcentage
   */
  static calculatePercentage(amount: number,percentage: number): number {
    return this.roundToTwoDecimals((amount * percentage) / 100);
  }

  /**
   * Appliquer une réduction
   */
  static applyDiscountPercentage(amount: number, discountPercentage: number): number {
    return (amount * discountPercentage) / 100;
  }

  static applyDiscountFixedAmount(amount: number, discountFixedAmount: number): number {
    return amount - discountFixedAmount;
  }

  static calculateSubtotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity,0);
  }

  static calculateTax(subtotal: number, RATE: number): number {
    return subtotal * RATE;
  }

  static calculateShipping(subtotal: number): number {
    return subtotal >= BusinessConstants.SHIPPING.FREE_SHIPPING_THRESHOLD ? 
    0 : BusinessConstants.SHIPPING.STANDARD_COST;
  }

  static calculateCartTotal(subtotal: number, tax: number, shippingCost: number, discountAmount: number): number {
    return this.roundToTwoDecimals(subtotal + tax + shippingCost - discountAmount);
  }

  static min(discountValue: number, subtotal: number): number {
    return Math.min(discountValue, subtotal);
  }

  static max(discountValue: number, subtotal: number): number {
    return Math.max(discountValue, subtotal);
  }
}