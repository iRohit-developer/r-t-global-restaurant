import { Injectable, Logger } from '@nestjs/common';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user.entity';

type SafeUser = {
    id: number;
    username: string;
    role: UserRole;
};

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService,
    ) {}

    async validateUser(username: string, password: string): Promise<SafeUser | null> {
        const user = await this.usersService.findByUsername(username);

        if (!user) {
            this.logger.warn(`Failed login attempt for unknown username: ${username}`);
            return null;
        }

        const isValidPassword = await compare(password, user.password);
        if (!isValidPassword) {
            this.logger.warn(`Failed login attempt with invalid password for username: ${username}`);
            return null;
        }

        this.logger.log(`User logged in successfully: ${username}`);

        return {
            id: user.id,
            username: user.username,
            role: user.role,
        };
    }

    async register(
        username: string,
        password: string,
        role: UserRole = UserRole.STAFF,
    ): Promise<SafeUser> {
        const user = await this.usersService.createUser(username, password, role);
        this.logger.log(`User registered successfully: ${username} (${role})`);
        return {
            id: user.id,
            username: user.username,
            role: user.role,
        };
    }

    login(user: SafeUser): { access_token: string; user: SafeUser } {
        const payload = { sub: user.id, username: user.username, role: user.role };

        return {
            access_token: this.jwtService.sign(payload),
            user,
        };
    }
}
