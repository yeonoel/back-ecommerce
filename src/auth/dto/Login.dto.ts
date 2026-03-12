import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString, Matches } from "class-validator";

export class LoginDto {
    @IsNotEmpty({ message: 'phone is required' })
    @IsString()
    @Matches(/^\+225(01|05|07|25|27)[0-9]{8}$/, { message: 'Phone must be in format +225XXXXXXXXXX' })
    phone: string;

    @IsNotEmpty()
    password: string;
}
