export class UserDataDto {
  id: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  role?: string;
  slugStore?: string;
  logoStore?: string;
}


export class AuthResponseDto {
  success: boolean;
  data: UserDataDto;
  token: string;
}