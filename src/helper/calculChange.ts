import { PercentageChangeDto } from "src/dashboard/dto/dashboard-stat.dto";

 /**
  * Calcul du taux de variation par raport au mois passé
  * @param current 
  * @param previous 
  * @param label 
  * @returns 
  */
 export function  calculateChange (current: number, previous: number, label: string) : PercentageChangeDto {
    if (previous === 0) {
      return {
        percentage: current > 0 ? 100 : 0,
        isPositive: current > 0,
        label,
      };
    }
    const percentage = ((current - previous) / previous) * 100;
    return {
      percentage: Math.round(percentage * 10) / 10,
      isPositive: percentage >= 0,
      label,
    };
  }