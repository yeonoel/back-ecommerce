import { ResponseDto } from "../../common/dto/responses/Response.dto";

export class ResponseFilterDto<T = any, M = any> extends ResponseDto<T> {
    meta?: M
}