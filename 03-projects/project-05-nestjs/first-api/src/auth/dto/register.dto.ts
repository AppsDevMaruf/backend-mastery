import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'Name must be a string' })
  name!: string;
  @IsEmail(undefined, { message: 'Email must be a valid email address' })
  email!: string;
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;
}
