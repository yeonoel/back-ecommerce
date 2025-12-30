import { ResponseDto } from "src/common/dto/ResponseDto";

export class ResponseFilterDto<T = any, M = any> extends ResponseDto<T> {
    meta?: M
}