export class UserDataDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}


export class AuthResponseDto {
  success: boolean;
  data: UserDataDto;
  token: string;
}