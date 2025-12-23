export class UserDataDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export class UsersResponseDto {
  success: boolean;
  data: UserDataDto;
}

export class AuthLoginResponseDto {
  success: boolean;
  data: UserDataDto;
  token: string;
}