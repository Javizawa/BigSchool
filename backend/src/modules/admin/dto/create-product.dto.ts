import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Gender } from '../../../../generated/prisma/client';

export class SeoDto {
  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @IsString()
  @IsOptional()
  canonicalUrl?: string;
}

export class CreateVariantDto {
  @IsString()
  sku: string;

  @IsNumber()
  @Min(0)
  size: number;

  @IsString()
  color: string;

  @IsString()
  @IsOptional()
  colorHex?: string;

  @IsInt()
  @Min(0)
  stock: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];
}

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsUUID()
  brandId: string;

  @IsUUID()
  categoryId: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  salePrice?: number;

  @IsDateString()
  @IsOptional()
  saleEndsAt?: string;

  @IsString()
  @MinLength(1)
  description: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ValidateNested()
  @Type(() => SeoDto)
  @IsOptional()
  seo?: SeoDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  @IsOptional()
  variants?: CreateVariantDto[];
}
