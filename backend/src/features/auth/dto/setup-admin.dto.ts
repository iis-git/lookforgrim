import { IsEmail, IsString, MinLength } from 'class-validator';

export class SetupAdminDto {
  @IsString()
  setupToken!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
