export class PercentageChangeDto {
  percentage: number;      // +12.5 ou -5.3
  isPositive: boolean;     // true si augmentation
  label: string;           // "vs mois dernier"
}

export class RevenueByMonthDto {
  month: string;           // "2024-01", "2024-02"
  revenue: number;
  orders: number;
  label?: string;          // "Jan 2024" (pour affichage)
}

export class TopProductDto {
  id: string;
  name: string;
  sales: number;           // Nombre de ventes
  revenue: number;         // CA généré
  image?: string;
  category?: string;
}

export class RecentOrderDto {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: Date;
}

export class LowStockProductDto {
  id: string;
  name: string;
  currentStock: number;
  lowStockThreshold: number;
  image?: string;
}

/*export class DashboardStatsDto {
  // KPIs principaux
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;

  // Évolutions (vs mois précédent)
  revenueChange: PercentageChangeDto;
  ordersChange: PercentageChangeDto;
  productsChange: PercentageChangeDto;
  customersChange: PercentageChangeDto;

  // Graphiques et listes
  revenueByMonth: RevenueByMonthDto[];
  topProducts: TopProductDto[];
  recentOrders: RecentOrderDto[];
  lowStockProducts: LowStockProductDto[];
} */

export class DashboardStatsDto {
  salesToday: number;
  salesThisMonth: number;
  totalRevenue: number;
  pendingDeliveries: number;
  outOfStockProducts: number;
}
