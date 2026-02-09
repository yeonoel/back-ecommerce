export class ProductStatsDto {
  totalProducts: number;
  inventoryValue: number;   
  lowStockCount: number;
  outOfStockCount: number;

  // Détails pour alertes
  lowStockProducts: LowStockProductsForProducstStats[];
  outOfStockProducts: OutOfStockProductDto[];
  
  // Stats supplémentaires (optionnel)
  activeProducts: number;
  inactiveProducts: number;
  featuredProducts: number;
  totalVariants: number;
}

export class LowStockProductsForProducstStats {
  id: string;
  name: string;
  stockQuantity: number;
  lowStockThreshold: number;
  image?: string;
  category?: string;
}

export class OutOfStockProductDto {
  id: string;
  name: string;
  category?: string;
  image?: string;
}