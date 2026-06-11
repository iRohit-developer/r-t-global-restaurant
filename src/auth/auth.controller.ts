import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiBody,
	ApiConflictResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto.js';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	@ApiOperation({ summary: 'Register a new user' })
	@ApiBody({ type: RegisterDto })
	@ApiOkResponse({
		description: 'User registered successfully and JWT token issued',
		type: AuthResponseDto,
	})
	@ApiBadRequestResponse({ description: 'Validation failed for input payload' })
	@ApiConflictResponse({ description: 'Username already exists' })
	async register(@Body() body: RegisterDto) {
		const user = await this.authService.register(body.username, body.password, body.role);
		return this.authService.login(user);
	}

	@Post('login')
	@ApiOperation({ summary: 'Authenticate user and return JWT token' })
	@ApiBody({ type: LoginDto })
	@ApiOkResponse({
		description: 'Authentication successful',
		type: AuthResponseDto,
	})
	@ApiUnauthorizedResponse({ description: 'Invalid username or password' })
	@ApiBadRequestResponse({ description: 'Validation failed for input payload' })
	async login(@Body() body: LoginDto) {
		const user = await this.authService.validateUser(body.username, body.password);

		if (!user) {
			throw new UnauthorizedException('Invalid username or password');
		}

		return this.authService.login(user);
	}
}
