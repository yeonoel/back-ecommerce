import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';
import { PaymentMethodType } from '../../payments/enums/payment-method-type.enum';
import { CreateAddressDto } from 'src/addresses/dto/create-address.dto';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from 'src/order-items/dto/create-order-item.dto';
export class CreateOrderDto {
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto;

  @IsEnum(PaymentMethodType)
  paymentMethod?: PaymentMethodType = PaymentMethodType.CASH;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  customerNote?: string;

  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number;
}



