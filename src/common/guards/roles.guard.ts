import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (!requiredRoles || requiredRoles.length === 0) {
			return true;
		}

		const request = context
			.switchToHttp()
			.getRequest<{ user?: { role?: UserRole } }>();

		if (!request.user?.role) {
			throw new UnauthorizedException('Missing authenticated user role');
		}

		if (!requiredRoles.includes(request.user.role)) {
			throw new ForbiddenException('You do not have permission to access this resource');
		}

		return true;
	}
}
