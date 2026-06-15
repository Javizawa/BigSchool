import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateVariantDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];

  @IsString()
  @IsOptional()
  colorHex?: string;
}
