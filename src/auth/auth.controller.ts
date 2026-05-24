import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	async register(@Body() body: RegisterDto) {
		const user = await this.authService.register(body.username, body.password, body.role);
		return this.authService.login(user);
	}

	@Post('login')
	async login(@Body() body: LoginDto) {
		const user = await this.authService.validateUser(body.username, body.password);

		if (!user) {
			throw new UnauthorizedException('Invalid username or password');
		}

		return this.authService.login(user);
	}
}
