import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
	@ApiProperty({ example: 'john', minLength: 3 })
	@IsString()
	@MinLength(3)
	username!: string;

	@ApiProperty({ example: 'strongPass123', minLength: 6 })
	@IsString()
	@MinLength(6)
	password!: string;
}
