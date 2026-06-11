import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/user.entity';

export class SafeUserDto {
	@ApiProperty({ example: 1 })
	id!: number;

	@ApiProperty({ example: 'john' })
	username!: string;

	@ApiProperty({ enum: UserRole, example: UserRole.STAFF })
	role!: UserRole;
}

export class AuthResponseDto {
	@ApiProperty({
		example:
			'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiam9obiIsInJvbGUiOiJzdGFmZiIsImlhdCI6MTcxMDAwMDAwMH0.xxxxx',
	})
	access_token!: string;

	@ApiProperty({ type: SafeUserDto })
	user!: SafeUserDto;
}
