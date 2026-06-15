import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class AddressDto {
  @IsString()
  @MinLength(1)
  alias: string;

  @IsString()
  @MinLength(1)
  street: string;

  @IsString()
  @MinLength(1)
  city: string;

  @IsString()
  @MinLength(1)
  province: string;

  @IsString()
  @MinLength(1)
  postalCode: string;

  @IsString()
  @Length(2, 2)
  country: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
