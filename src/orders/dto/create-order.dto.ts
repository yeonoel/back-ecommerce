import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';
import { PaymentMethodType } from '../../payments/enums/payment-method-type.enum';
import { CreateAddressDto } from 'src/addresses/dto/create-address.dto';
import { Type } from 'class-transformer';
export class CreateOrderDto {
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto;

  @IsEnum(PaymentMethodType)
  paymentMethod: PaymentMethodType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  customerNote?: string;
}



