import { IsString, IsNotEmpty, IsOptional, IsUrl, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateStoreDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    vendorName: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8) // Sécurité minimale pour le mot de passe
    password: string;

    @IsString()
    @IsOptional()
    @MaxLength(1000)
    description?: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^\+225\d{10}$/, {
        message: 'Le numéro doit commencer par +225 suivi de 10 chiffres (ex: +22505XXXXXXXX)'
    })
    whatsappNumber: string;

    @IsUrl()
    @IsOptional()
    logo?: string;
}
