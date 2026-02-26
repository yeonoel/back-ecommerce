import { IsString, IsNotEmpty, IsEmail, MinLength, MaxLength, Matches } from 'class-validator';

export class OnboardingDto {
    @IsString()
    @IsNotEmpty()
    inviteCode: string;

    // Le vendeur définit son vrai mot de passe lors de l'onboarding
    @IsString()
    @MinLength(8)
    newPassword: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^\+225(01|05|07|25|27)[0-9]{8}$/, { message: 'Phone must be in format +225XXXXXXXXXX' })
    phoneNumber: string;

    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;
}