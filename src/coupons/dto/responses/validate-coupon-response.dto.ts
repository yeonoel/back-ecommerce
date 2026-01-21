export class ValidateCouponResponseDto {
  isValid: boolean;
  discount?: number;
  message?: string;
  couponId?: string;
}