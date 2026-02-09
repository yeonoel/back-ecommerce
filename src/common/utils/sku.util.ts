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

export function generateSku(productName: string): string {
  const prefix = 'PRD';

  const namePart = productName
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 3)
    .toUpperCase();

  const randomPart = Math.random()
    .toString(36)
    .substring(2, 7)
    .toUpperCase();

  return `${prefix}-${namePart}-${randomPart}`;
}