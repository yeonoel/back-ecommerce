export class UserDataDto {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}


export class AuthResponseDto {
  success: boolean;
  data: UserDataDto;
  token: string;
}