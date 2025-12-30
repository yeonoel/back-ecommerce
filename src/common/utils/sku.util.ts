import { randomUUID } from "crypto";

export function generateVariantSku(productSku?: string, variant?: { color?: string; size?: string },): string {
  return [
    productSku,
    variant?.color?.toUpperCase(),
    variant?.size?.toUpperCase(),
    randomUUID(),
  ]
    .filter(Boolean)
    .join('-');
}
