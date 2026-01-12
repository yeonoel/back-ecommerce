import { IsOptional, IsString } from 'class-validator';

export class ImagesMetaFormDto {
  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @IsString()
  isPrimary?: string;

  @IsOptional()
  @IsString()
  displayOrder?: string;
}
