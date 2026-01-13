import { PartialType } from '@nestjs/mapped-types';
import { CreateCartItemDto } from './create-cart-item.dto';
import { IsInt, Min } from 'class-validator';

export class UpdateCartItemDto {
    @IsInt()
    @Min(1)
    quantity: number
}
