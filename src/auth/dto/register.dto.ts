import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../users/user.entity';

export class RegisterDto {
	@IsString()
	@MinLength(3)
	username!: string;

	@IsString()
	@MinLength(6)
	password!: string;

	@IsOptional()
	@IsEnum(UserRole)
	role?: UserRole;
}
