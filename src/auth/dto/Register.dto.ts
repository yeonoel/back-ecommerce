import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, IsUrl, Matches, MinLength } from "class-validator";

export class RegisterDto {
    @IsNotEmpty({ message: 'phone is required' })
    @IsString()
    @Matches(/^\+225(01|05|07|25|27)[0-9]{8}$/, { message: 'Phone must be in format +225XXXXXXXXXX' })
    phone: string;

    @IsNotEmpty({ message: 'password is required' })
    @IsString()
    @MinLength(6, { message: 'password must be at least 6 characters' })
    password: string;

    @IsNotEmpty({ message: 'firstName is required' })
    @IsString()
    firstName: string;

    @IsNotEmpty({ message: 'lastName is required' })
    @IsString()
    lastName: string;

    @IsOptional()
    @IsString()
    @IsUrl()
    avatarUrl?: string;

    @IsString()
    @IsNotEmpty()
    storeSlug?: string;
}
