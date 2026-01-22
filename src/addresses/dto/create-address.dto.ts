import { IsEnum, IsOptional, IsString, MaxLength, IsBoolean } from 'class-validator';
import { AddressType } from '../enums/address-type.enum';

export class CreateAddressDto {
  @IsOptional()
  @IsEnum(AddressType)
  addressType?: AddressType = AddressType.SHIPPING;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;

  @IsString()
  @MaxLength(255)
  streetAddress: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  apartment?: string;

  @IsString()
  @MaxLength(100)
  city: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsString()
  @MaxLength(20)
  postalCode: string;

  @IsString()
  @MaxLength(100)
  country: string;
}
