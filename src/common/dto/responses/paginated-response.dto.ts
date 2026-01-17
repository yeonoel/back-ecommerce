import { PaginationMetaDto } from "./pagination-meta.dto";

export class PaginatedResponseDto<T> {
  items: T[];
  pagination: PaginationMetaDto;
}