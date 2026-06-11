import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../users/user.entity';

export class RegisterDto {
	@ApiProperty({ example: 'john', minLength: 3 })
	@IsString()
	@MinLength(3)
	username!: string;

	@ApiProperty({ example: 'strongPass123', minLength: 6 })
	@IsString()
	@MinLength(6)
	password!: string;

	@ApiPropertyOptional({ enum: UserRole, example: UserRole.STAFF })
	@IsOptional()
	@IsEnum(UserRole)
	role?: UserRole;
}
