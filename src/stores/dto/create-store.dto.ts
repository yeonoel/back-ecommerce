import { IsString, IsNotEmpty, IsOptional, IsUrl, Matches, MaxLength } from 'class-validator';

export class CreateStoreDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @IsString()
    @IsOptional()
    @MaxLength(1000)
    description?: string;

    @IsUrl()
    @IsOptional()
    logoUrl?: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{10,15}$/, { message: 'phoneNumber must be a valid international number without + (ex: 225XXXXXXXXX)' })
    phoneNumber: string;

    // Nom du vendeur pour personnaliser le message WhatsApp
    @IsString()
    @IsOptional()
    @MaxLength(255)
    vendorName?: string;
}