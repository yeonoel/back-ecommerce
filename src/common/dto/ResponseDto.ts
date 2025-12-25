export class ResponseDto<T = any> {
  success: boolean;
  message: string;
  data?: T;
}