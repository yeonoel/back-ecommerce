import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, IsUrl, MinLength } from "class-validator";

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty({ message: 'email is required' })
    @IsString()
    email: string;

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
    @IsPhoneNumber('CI')
    phone?: string;

    @IsOptional()
    @IsString()
    @IsUrl()
    avatarUrl?: string;
}
